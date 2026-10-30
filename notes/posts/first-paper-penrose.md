---
title: "My first paper: stealing energy from spinning black holes (and their mimickers)"
date: 2022-06-02
updated: 2026-10-30
tags: [physics]
summary: The Penrose process in plain words, and what my first paper found when we ran it around Kerr black hole mimickers. One family matched Kerr exactly; another was far more efficient.
related: [msc-thesis, jmn-magnetic-field, ml-black-hole-energy-extraction]
---

This was my first paper, and I still remember how exciting it was to see it go up on [arXiv](https://arxiv.org/abs/2206.00428). It was later published in [Universe](https://doi.org/10.3390/universe8110571) (volume 8, issue 11, October 2022) as *Rotational Energy Extraction from the Kerr Black Hole's Mimickers*, written with my co-authors.

The short version: we used the Penrose process to extract rotational energy from objects that look like spinning black holes from the outside but have no singularity at the centre. For one family (rotating Simpson-Visser spacetimes), the efficiency came out exactly the same as for an ordinary Kerr black hole. For another (conformally transformed spacetimes), it was much higher, which could in principle help tell them apart.

## The Penrose process, simply

A spinning black hole drags space around with it. Just outside the horizon there is a region, called the **ergoregion**, where this dragging is so strong that nothing can stay still; everything is forced to rotate with the black hole.

In 1969, Roger Penrose noticed something surprising. Imagine throwing a rock into the ergoregion, and the rock splits in two. One piece falls into the black hole in a special way that effectively carries *negative* energy. The other piece flies back out carrying *more* energy than the original rock had. The extra energy comes from the black hole's spin, which slows down a tiny bit. You have taken energy out of a black hole.

How much you can gain is measured as an **efficiency**: the extra energy that comes out, as a percentage of the energy you threw in. For a Kerr black hole spinning as fast as it can, the maximum is about 20.7%.

## Why it still matters

The original idea is not very efficient, but its descendants are central to black hole astrophysics:

- The **magnetic Penrose process** adds magnetic fields and can be far more efficient. It is one way to explain how black holes power extremely energetic particles.
- The **Blandford-Znajek mechanism**, an electromagnetic cousin of the same idea, is a leading explanation for the huge jets we see shooting out of galaxies with spinning black holes at their centres.
- The **collisional Penrose process** looks at particles smashing together near a black hole, which can reach very high energies.

## What we asked

Some theorists have proposed objects that look almost exactly like spinning (Kerr) black holes from the outside, but avoid the infinitely dense point at the centre. We call them **black hole mimickers**. We asked: if you run the Penrose process around them, does anything change?

We looked at two families:

- **Rotating Simpson-Visser spacetimes.** These smooth out the Kerr geometry with a regularisation parameter *l*, a length scale that removes the central singularity. At *l* = 0 you get back the ordinary Kerr black hole. Depending on *l*, the object can have horizons like a black hole or become a wormhole.
- **Conformally transformed spacetimes.** These rescale the Kerr geometry by a factor (1 + *l*²/Σ)^ν, where *l* is again a length scale (taken to be of the order of the black hole's mass). With ν = 4 the result is a regular black hole with no singularity; with ν = 3 it is still singular.

## What we found

**Simpson-Visser: exactly like Kerr.** For every value of *l* we tested (0, 0.6, 1.4, and 1.8), the efficiency at the event horizon was identical to the Kerr value at the same spin. At spin 0.5 it was 1.7638% in every case. This surprised us: the inside of the object is completely different, but the energy you can extract does not depend on the regularisation parameter at all.

**Conformal: far more efficient.** Here the ergoregion turned out to be the same as Kerr's, independent of *l*, yet the efficiency was much larger, and it grew with *l*. Some values from the paper's tables (spin *a* in units of the mass):

| Object | *a* = 0.5 | *a* = 1 (maximum spin) |
|---|---|---|
| Kerr black hole (*l* = 0) | 1.76% | 20.71% |
| Simpson-Visser (any *l* tested) | 1.76% | 20.71% |
| Conformal, singular (ν = 3, *l* = 1.6) | 8.63% | 289.55% |
| Conformal, regular (ν = 4, *l* = 1.6) | 14.24% | 585.65% |

An efficiency above 100% means the escaping piece gains more energy than the original particle carried. The regular solution gave larger values than the singular one, and the gap from Kerr was largest at extreme spin.

## Why the difference matters

If two objects look the same from far away, you need some physical process that behaves differently around them to tell them apart. Our result says the Penrose process cannot separate a Simpson-Visser mimicker from a Kerr black hole, but it could, in principle, separate a conformally transformed one, because far more energy can be extracted from it. Turning that into an observational test is a separate step; this paper is the theoretical part.

If you are curious where computing fits into calculations like these, I wrote about it in [Where machine learning meets black hole energy extraction](notes/ml-black-hole-energy-extraction/).

Looking back, this paper taught me how research actually works: a lot of patient calculation, a lot of plots that don't work the first time, and the quiet joy when they finally do.
