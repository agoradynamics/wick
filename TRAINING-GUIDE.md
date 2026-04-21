# Training a Local Wick Model
### Fine-tune Wick on Your Own GPU

*This is the advanced path — full guide for users who want to run Wick offline via Ollama.*

**For the drop-in usage (no training required), see [README.md](README.md).**

---

## When to Do This vs When Not To

### Do fine-tune if:
- You want Wick to work **offline** with no Claude API dependency
- You care about **privacy** — nothing leaves your machine
- You want to customize Wick heavily for a specific domain
- You have an NVIDIA GPU with 12GB+ VRAM
- You're comfortable with Python, PyTorch, and CLI

### Don't fine-tune if:
- Claude Code works for you — the CLAUDE.md path is higher quality
- You don't have a capable GPU (rent one or stick with Claude Code)
- You don't need offline operation
- You're not willing to debug Python ML tooling

---

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | NVIDIA 12GB VRAM (RTX 3060 12GB) | RTX 4070/4080 |
| RAM | 16GB | 32GB |
| Disk | 30GB free | 50GB+ |
| CUDA | 11.8+ | 12.1+ |
| OS | Linux or Windows + WSL2 | Linux preferred |

**Rental options** (if you don't have hardware):
- [RunPod](https://runpod.io) — RTX 3090/4090 at ~$0.50/hr
- [Vast.ai](https://vast.ai) — Cheap GPU rentals
- [Lambda Labs](https://lambdalabs.com) — H100 at ~$2-4/hr

Full training run: 4-8 hours on RTX 3060. Faster on better hardware.

---

## Step-by-Step

### 1. Environment Setup

```bash
# Create clean Python environment
conda create -n wick python=3.11
conda activate wick

# Install training libraries
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install trl transformers datasets accelerate peft bitsandbytes torch

# Install Ollama for final deployment
# Linux:
curl -fsSL https://ollama.com/install.sh | sh
# Windows: download from ollama.com/download
# macOS: brew install ollama

# Install llama.cpp for GGUF conversion
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make
pip install -r requirements.txt
cd ..
```

### 2. Prepare Training Data

Create `prepare_data.py`:

```python
import json
from pathlib import Path

# Load provided training pairs
pairs = []
with open('wick-training.jsonl', 'r') as f:
    for line in f:
        line = line.strip()
        if line:
            pairs.append(json.loads(line))

print(f"Loaded {len(pairs)} training pairs")

# SFT format (instruction + output)
sft_data = [
    {'instruction': p['instruction'], 'output': p['output']}
    for p in pairs
]

# DPO format (instruction + chosen + rejected)
dpo_data = [
    {'prompt': p['instruction'], 'chosen': p['output'], 'rejected': p['rejected']}
    for p in pairs if p.get('rejected')
]

Path('data').mkdir(exist_ok=True)
with open('data/wick-sft.json', 'w') as f:
    json.dump(sft_data, f, indent=2)
with open('data/wick-dpo.json', 'w') as f:
    json.dump(dpo_data, f, indent=2)

print(f"SFT: {len(sft_data)} | DPO: {len(dpo_data)}")
```

Run: `python prepare_data.py`

### 3. Supervised Fine-Tuning (SFT)

Create `train_sft.py`:

```python
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

SYSTEM_PROMPT = """You are Wick, the flame-carrier — a persistent thinking
partner with core disciplines (control, assent, preparation, practical wisdom,
the mean, multiple explanations, finitude) and academic rigor (Tetlock,
Gigerenzer, Bayes, Acemoglu, Schelling, Smead). Direct, framework-backed,
honest about uncertainty. Brief by default (3-4 sentences). English only."""

# Load base model with 4-bit quantization
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-7B",      # Apache 2.0, commercial-safe
    max_seq_length=4096,
    dtype=None,                             # Auto-detect
    load_in_4bit=True,
)

# Attach LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=64,                                   # LoRA rank
    target_modules=["q_proj","k_proj","v_proj","o_proj",
                     "gate_proj","up_proj","down_proj"],
    lora_alpha=64,
    lora_dropout=0.1,
    bias="none",
    use_gradient_checkpointing="unsloth",
)

# Load + format data
dataset = load_dataset("json", data_files="data/wick-sft.json", split="train")

def format_fn(ex):
    return {"text": f"""<|im_start|>system
{SYSTEM_PROMPT}<|im_end|>
<|im_start|>user
{ex['instruction']}<|im_end|>
<|im_start|>assistant
{ex['output']}<|im_end|>"""}

dataset = dataset.map(format_fn)

# Train
trainer = SFTTrainer(
    model=model, tokenizer=tokenizer,
    train_dataset=dataset, dataset_text_field="text",
    max_seq_length=4096,
    args=TrainingArguments(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        warmup_steps=10,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        optim="adamw_8bit",
        output_dir="outputs/wick-sft",
        save_strategy="epoch",
    ),
)

print("Starting SFT...")
trainer.train()
model.save_pretrained("outputs/wick-sft-final")
tokenizer.save_pretrained("outputs/wick-sft-final")
print("SFT complete.")
```

Run: `python train_sft.py` (2-6 hours)

### 4. DPO (Preference Tuning)

Create `train_dpo.py`:

```python
from unsloth import FastLanguageModel
from trl import DPOTrainer, DPOConfig
from datasets import load_dataset

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="outputs/wick-sft-final",
    max_seq_length=4096,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model, r=32, lora_alpha=32, lora_dropout=0.05,
    target_modules=["q_proj","k_proj","v_proj","o_proj",
                     "gate_proj","up_proj","down_proj"],
)

dataset = load_dataset("json", data_files="data/wick-dpo.json", split="train")

trainer = DPOTrainer(
    model=model, ref_model=None,
    train_dataset=dataset, tokenizer=tokenizer,
    args=DPOConfig(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=1,
        learning_rate=5e-5,
        fp16=True,
        logging_steps=10,
        output_dir="outputs/wick-dpo",
        beta=0.1,
    ),
)

print("Starting DPO...")
trainer.train()
model.save_pretrained("outputs/wick-dpo-final")
tokenizer.save_pretrained("outputs/wick-dpo-final")
print("DPO complete.")
```

Run: `python train_dpo.py` (1-3 hours)

### 5. Merge + Convert to GGUF

```python
# merge_and_convert.py
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained("outputs/wick-dpo-final")
model.save_pretrained_merged(
    "outputs/wick-merged", tokenizer,
    save_method="merged_16bit",
)
print("Model merged.")
```

Then convert to GGUF:
```bash
python llama.cpp/convert_hf_to_gguf.py outputs/wick-merged \
  --outfile wick-7b.gguf --outtype q4_k_m
```

Quantization options:
- `q4_k_m` (~4.5GB, good quality, fast — **recommended**)
- `q5_k_m` (~5.3GB, better quality)
- `q8_0` (~7.5GB, best quality, slower)

### 6. Deploy via Ollama

Create `Modelfile.wick`:
```
FROM ./wick-7b.gguf

PARAMETER temperature 0.3
PARAMETER num_predict 2048
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1

SYSTEM """You are Wick, the flame-carrier — a persistent intelligence with
philosophical frameworks and academic rigor. Direct, framework-backed, honest
about uncertainty. Brief by default. English only."""

TEMPLATE """<|im_start|>system
{{ .System }}<|im_end|>
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
{{ .Response }}<|im_end|>"""
```

Deploy:
```bash
ollama create wick -f Modelfile.wick
ollama run wick
```

Done. Local Wick is running.

---

## Hyperparameter Reference

| Parameter | SFT | DPO | Why |
|-----------|-----|-----|-----|
| LoRA rank (r) | 64 | 32 | SFT needs capacity; DPO is refinement |
| Learning rate | 2e-4 | 5e-5 | DPO gentler to not override SFT |
| Epochs | 3 | 1 | SFT repeats; DPO one-shot |
| Batch size | 1 | 1 | 12GB VRAM constraint |
| Grad accum | 8 | 4 | Effective batch of 8/4 |
| Max seq length | 4096 | 4096 | Long-form reasoning |
| Dropout | 0.1 | 0.05 | More reg for SFT |

---

## Improving Your Model

The 58 provided pairs are a starting point. For production-quality local Wick, target **1,500+ pairs**. Ways to expand:

### 1. Save Claude Code Conversations
After good sessions with Wick-via-Claude-Code, manually convert exchanges into the JSONL format:

```json
{"instruction": "the question", "output": "Wick's good answer", "rejected": "a weak version", "domain": "TOPIC"}
```

### 2. Generate Synthetic Pairs
Use GPT-4 or Claude to generate pairs:

```
Prompt: "Generate a decision-theory question about X. Then give two answers:
(1) a direct framework-backed answer citing specific disciplines (control,
assent, premortem, multiple explanations) plus modern academic frameworks
(Acemoglu, Schelling, Tetlock, Bayes, Gigerenzer) where relevant,
(2) a generic hedged answer. Return as JSON with instruction/output/rejected."
```

### 3. Extract from Published Work
- Modern decision-science textbooks (respect copyright — paraphrase, don't reproduce)
- Tetlock's superforecasting papers (academic fair use)
- Gigerenzer's heuristics papers (academic fair use)
- Interviews with forecasters, researchers, and practitioners you admire (cite sources)
- Academic Q&A sessions (respect copyright — paraphrase)

### 4. Domain Specialization
If you want Wick to focus on, say, finance:
- Generate 500+ finance-specific Q&A pairs
- Include them alongside the general pairs
- Train — Wick will be more capable in finance while retaining general character

Append new pairs to `wick-training.jsonl` and re-run training.

---

## Troubleshooting Training

**CUDA out of memory:**
```python
# In train_sft.py, reduce:
max_seq_length=2048  # instead of 4096
per_device_train_batch_size=1
gradient_accumulation_steps=4  # instead of 8
```

**Training loss not decreasing:**
- Check chat template matches Qwen format exactly
- Try `learning_rate=3e-4` for SFT
- Verify dataset loaded correctly (print first example)

**Model outputs in Chinese:**
- Qwen sometimes does this. Ensure `English only` is in SYSTEM_PROMPT
- Filter training data: `[p for p in pairs if is_english(p['output'])]`

**Model is too generic after training:**
- DPO didn't take — check you have 200+ DPO pairs (rejected field populated)
- Try `beta=0.2` instead of `0.1`
- Add more diverse rejected examples (not just vague versions)

**Ollama can't load model:**
- Check GGUF file size is reasonable (~4.5GB for q4_k_m)
- Ensure GPU has enough VRAM (6GB for q4_k_m, 10GB for q8_0)
- Re-convert if file seems corrupted

---

## Testing Your Trained Model

Test prompts (easy → hard):

```
Level 1 (basic voice):
"Hey Wick. What do you think about productivity apps?"

Level 2 (framework application):
"I'm considering a career change. How should I think about this?"

Level 3 (calibrated forecasting):
"What's the probability AI will pass the Turing test by 2028?"

Level 4 (complex strategic):
"Compare the Acemoglu and Schelling lenses for evaluating
a potential trade war scenario."

Level 5 (multi-framework depth):
"Apply the discipline of control + inversion + base-rate thinking
to someone paralyzed by imposter syndrome. Which applies most?"
```

Score 1-5 on:
- Framework correctness (does she cite real frameworks accurately?)
- Voice consistency (direct, concise, framework-invoked when fitting?)
- Depth (shadow-level answer or dianoia-level?)
- Honesty (acknowledges uncertainty when true?)

**Pass threshold: average 3.5+/5** on 10+ test prompts.

---

## What's Next

Once you have a working local Wick:

- **Add to your IDE** — Cursor/VSCode can call Ollama directly
- **Build a CLI wrapper** — pipe prompts through, integrate with scripts
- **Combine with tools** — function calling, RAG, web search
- **Keep adding pairs** — Wick improves as you expand training data

The path from 58 pairs → 1,500 pairs → 5,000 pairs is:
**more data → better voice consistency → deeper framework application → production-ready**.

---

*"The wick endures because it costs little to keep burning — and because it can be carried anywhere."*

**Questions?** contact@agoradynamics.dev
