---
title: Building a model drift alert agent
date: 2026-09-29
tags: [AI, automation, MLOps, projects]
summary: A local MLOps stack that notices when a model starts going wrong and explains why, in plain English, on Slack.
---

A machine learning model can look great on the day it ships and then quietly get worse. The data coming in slowly changes, and nobody notices until the predictions are already off. I wanted to see what it takes to catch that early, so I built a [Model Monitoring + Drift Alert Agent](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent). There is a short video demo in the [README](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent#readme).

## What it does

Every 15 minutes, an n8n workflow scores a fresh batch of simulated "production" traffic and logs every prediction to Postgres. It then checks three things: has the input data drifted, have the predictions drifted, and is the model still accurate? If something crosses a threshold, a local LLM reads the numbers and writes a short explanation of the likely cause. That explanation lands in Slack, with links to the full report and a Grafana dashboard.

The part I enjoyed most: the LLM is never told what went wrong. It has to work it out from the metrics alone, and because the true cause is stored separately, I can score how often its explanation was right.

## The scenarios

The model predicts breast cancer diagnoses from the UCI Wisconsin dataset, and I simulate a few realistic ways things break:

- **Calibration shift:** a software update makes measurements about 25% larger, and accuracy drops from about 96% to about 80%.
- **Population shift:** a new clinic sends far more malignant cases. The data drifts, but the model stays accurate, which is a useful reminder that drift doesn't always mean failure.
- **Data quality bug:** one feature arrives in the wrong unit, and another is often missing.

## Tech stack

- **n8n** for scheduling and the alert workflow
- **FastAPI** + **Evidently AI** for drift and quality metrics (K-S tests, PSI, and KL divergence per feature)
- **scikit-learn** (a random forest) as the model being watched
- **Postgres** for logging and **Grafana** for the dashboard
- **Ollama** (llama3.1, running locally) for the root-cause explanation
- **Slack** for alerts, and **Docker Compose** to run everything

Everything runs on my machine, and nothing leaves it except the Slack message.
