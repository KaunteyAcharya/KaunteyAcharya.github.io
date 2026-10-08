---
title: Where machine learning meets black hole energy extraction
date: 2022-10-19
tags: [physics, research, AI]
summary: Machine learning doesn't calculate the Penrose process for us, but it is quietly becoming essential to everything around it.
---

Most of my research time goes into one question: how much energy can you pull out of a spinning black hole (or something that only looks like one)? That is pen-and-paper work plus a lot of numerical code. Lately I keep wondering where machine learning fits into this, so here are my notes on it.

## First, an honest answer

Machine learning is not calculating energy extraction for anyone. The Penrose process, the magnetic Penrose process, and the efficiency numbers we publish all still come from solving equations in a known spacetime. What ML is doing is helping with the hard parts *around* that calculation, and that turns out to matter a lot.

## 1. Measuring spin, the energy source

Every energy extraction mechanism feeds on the black hole's spin. No spin, no ergoregion, no Penrose process. So the most important number is also one of the hardest to measure.

What I found most interesting is a 2020 paper called **Deep Horizon**. The authors trained neural networks on around 100,000 simulated images of black holes surrounded by glowing plasma. The networks then learned to read off the mass, the accretion rate, the viewing angle, and even classify the spin from a single image, with uncertainty estimates attached.

With the Event Horizon Telescope images of M87* (2019) and now Sgr A* (May 2022), this suddenly feels very real. A network that can look at a shadow and say "this one is spinning fast" is directly useful for asking how much energy could be extracted from it.

## 2. Making simulations cheaper

The realistic version of energy extraction involves magnetised plasma swirling around the black hole, which needs huge general relativistic magnetohydrodynamics (GRMHD) simulations. A single run can take enormous amounts of computing time.

Here ML can act as an **emulator**: train a network on a set of expensive simulations, and it learns to predict the outcome for new parameters almost instantly. That means you can explore far more combinations of spin, magnetic field, and accretion than brute force would ever allow.

## 3. Solving the equations themselves

**Physics-informed neural networks** (PINNs) take a different route. Instead of learning only from data, the network is trained so that its output satisfies the governing equations directly. People have started using this idea for problems in general relativity, including solving for spacetime geometries. It is still early, but I love the idea of the physics living inside the loss function.

## Where I see it helping my own work

In my papers, a big chunk of the effort is scanning parameter space: how does the efficiency change as spin, charge, magnetic field, or a deformation parameter changes? Right now that is careful grids and a lot of plots. A model that learns the efficiency surface, or flags the interesting regions to look at more closely, could save weeks.

My feeling is that the physics will stay the core, and machine learning will become the tool that helps us measure, simulate, and search faster. I want to learn it properly.
