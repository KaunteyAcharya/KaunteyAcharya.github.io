---
title: Building a model drift alert agent with Evidently, n8n, and a local LLM
date: 2026-09-29
updated: 2026-10-30
tags: [AI, projects]
summary: A local MLOps stack that notices when a model starts going wrong and explains why, in plain English, on Slack. The metrics, the alert rules, four failure scenarios, and what the test runs showed.
related: [local-rag-agent, tickerbrief, ai-benchmarks]
---

A machine learning model can look great on the day it ships and then quietly get worse. The data coming in slowly changes, and nobody notices until the predictions are already off. I wanted to see what it takes to catch that early, so I built a [Model Monitoring + Drift Alert Agent](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent). There is a short video demo in the [README](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent#readme).

In short: every 15 minutes it scores a batch of traffic, measures how far the data, the predictions, and the accuracy have moved from a frozen baseline, and if a rule fires, a local LLM writes a plain-English guess at the cause and posts it to Slack. The main lesson from testing it: **drift and degradation are different signals**. One scenario moved about 90% of the features and the model stayed accurate; another moved only a quarter of them and accuracy fell by 15 points.

## The problem

Labels that would show a drop in accuracy often arrive late, sometimes weeks after the prediction. So a monitoring system needs leading indicators (changes in the inputs and outputs) plus fast triage: an alert that says what changed and why it probably happened, not just "PSI = 2.4".

## Architecture

```
n8n schedule -> drift-monitor (FastAPI + Evidently) -> Postgres <- Grafana dashboard
      |               | JSON report + HTML report
      v               v
 threshold? -- yes -> Ollama (llama3.1, local) -> Slack alert -> summary saved to Postgres
```

One monitoring cycle runs like this:

1. **Trigger.** n8n runs every 15 minutes. Its Config node holds all the alert thresholds.
2. **Traffic.** A simulator generates 400 rows of "production" requests, optionally with a drift pattern injected.
3. **Score and log.** A frozen random forest predicts each case, and every prediction, probability, and actual label is logged to Postgres.
4. **Analyse.** Evidently AI compares the batch with a 228-row reference set and produces a JSON summary and an interactive HTML report.
5. **Decide.** Deterministic rules decide whether to alert, and how severe it is (ok, warning, or critical).
6. **Explain.** If an alert fires, n8n sends the metrics (and only the metrics) to a local Llama 3.1 model through Ollama.
7. **Notify.** Slack gets the severity, the key numbers, the reasons, the LLM's explanation, and buttons for the report and the Grafana dashboard.
8. **Audit.** The explanation and whether Slack received it are written back to Postgres. If the monitor itself is down, Slack gets a "pipeline failed" alert instead of silence.

## What it measures

| Signal | Method | Default alert rule |
|---|---|---|
| Feature drift | Kolmogorov-Smirnov test per feature, plus PSI and KL divergence | any feature with PSI ≥ 0.25 |
| Dataset drift | Share of features that drifted | ≥ 30% of features |
| Prediction drift | PSI of the predicted probability | ≥ 0.20 |
| Target drift | Change in the actual malignant rate (Z-test) | p < 0.05 |
| Model quality | Accuracy, precision, recall, F1, ROC AUC versus the reference | accuracy drop ≥ 5 points or recall drop ≥ 10 points is critical |
| Data quality | Share of missing values per feature | ≥ 5% is critical |

PSI (Population Stability Index) compares how a feature's values are spread across buckets now versus in the reference data. Near 0 means the same shape; above 0.25 is a common rule of thumb for a significant shift. All thresholds live in the n8n Config node, so they can be tuned without touching code, and each run records the thresholds it used.

## The scenarios

The model predicts breast cancer diagnoses from the UCI Breast Cancer Wisconsin dataset, a classic dataset that ships with scikit-learn, so the build works offline. I simulate four realistic ways things break:

- **Calibration shift:** an imaging software update makes measured cell nuclei about 25% larger, while the true diagnoses stay the same.
- **Population shift:** a new referral clinic sends far more malignant cases.
- **Data quality bug:** an upstream bug puts one feature (`mean_area`) in the wrong unit, and another (`worst_concavity`) often arrives empty.
- **Auto:** a storyline that cycles through healthy traffic, a gradually worsening calibration shift, a population shift, and a data bug, so the Grafana timeline looks like a real incident history.

## What the test runs showed

| Injected scenario | What Evidently saw | Effect on the model | Alert |
|---|---|---|---|
| Healthy traffic | 0% of features drifted, max PSI about 0.05 | accuracy about 96% | none |
| Calibration shift (full) | 8 features with PSI above 0.25, prediction PSI about 0.85 | accuracy 96.5% to about 80%, precision 0.99 to 0.69 | critical |
| Population shift | 87 to 90% of features drifted, malignant rate 37% to 82% | accuracy about 93%, model still valid | warning |
| Data quality bug | one feature with PSI about 3.8, 35% missing values | accuracy unchanged, because imputation hides it | critical |

Two results stand out. The population shift moved almost every feature, yet the model stayed accurate. The calibration shift moved only about a quarter of the features and cost 15 accuracy points. A monitor that only counts drifted features would get both of these backwards, which is why this one looks at drift, quality, and data-quality signals together.

The data bug is a third lesson: accuracy did not move at all, because missing values were filled in before prediction. Only the data-quality check caught it.

## Keeping the LLM honest

The LLM explains; it never decides. Alerting is rule-based, so a bad LLM reply can never suppress or invent an alert, and Slack still gets the raw numbers if Ollama is down.

The LLM is also never told what went wrong. The simulated scenario is stored in the database but withheld from the prompt, so the model has to infer the cause from the metrics alone. Because the true cause is stored, I can score how often its explanation was right.

## Design decisions

- **n8n calls an HTTP service instead of running Python itself.** n8n 2.x disables the Execute Command node by default, and its image has no Python. So the drift code runs in its own FastAPI container, and n8n calls `POST /run`. That also keeps the ML dependencies out of the orchestrator, and the same code runs from the command line.
- **Least-privilege databases.** n8n, the monitor, and Grafana each get their own database role, and Grafana's is read-only.
- **Everything as code.** The schema, database roles, Grafana datasource and dashboard, and the n8n workflow are all in the repository.
- **Graceful failure.** If Ollama or Slack fails, the run still completes; if the monitor fails, that failure is itself an alert.

## Tech stack

- **n8n** for scheduling, branching, and the alert workflow
- **FastAPI** + **Evidently AI** for drift and quality metrics (K-S tests, PSI, and KL divergence per feature)
- **scikit-learn** (a random forest) as the model being watched
- **Postgres** for logging and **Grafana** for the dashboard
- **Ollama** (Llama 3.1 8B, running locally) for the root-cause explanation
- **Slack** for alerts, and **Docker Compose** to run everything

Everything runs on my machine, and nothing leaves it except the Slack message.

## Limitations

- Actual labels are logged immediately here. In production they arrive later, so a real deployment needs a job that joins labels in when they land, with drift as the early warning until then.
- The traffic is simulated. A real inference service could write to the same `predictions` table without changing the rest.
- The LLM's explanations are not yet scored automatically against the stored ground truth, which would make it possible to compare prompts and models.
- On a CPU, Llama 3.1 8B can take 30 to 90 seconds per explanation. A smaller model such as `qwen3:4b` is faster.

The full design, metrics, and setup steps are in the [repository's architecture document](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent/blob/main/docs/ARCHITECTURE.md).
