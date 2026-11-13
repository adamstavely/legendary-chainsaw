# Near-duplicate pieces

Pairs of pieces whose light thumbnails look almost the same: a cosine similarity of 0.92 or more between their
CLIP embeddings. Each is a candidate to merge, or to make look more distinct. Some are expected, such as a component
and the block built around it.

Written by `npm run similarity`; don't edit by hand.

| Piece                             | Looks like                          | Similarity |
| --------------------------------- | ----------------------------------- | ---------- |
| Element Inspector (Components)    | Tool Call Card (Components)         | 0.940      |
| Artifact Panel (Components)       | Tool Call Card (Components)         | 0.929      |
| Number Field (Components)         | Secret Field (Components)           | 0.928      |
| Case Review (Blocks)              | Red-team Finding (Blocks)           | 0.927      |
| Collaboration Stream (Components) | Correction Propagation (Components) | 0.923      |
| Eval Criteria Editor (Components) | Review Queue (Components)           | 0.923      |
