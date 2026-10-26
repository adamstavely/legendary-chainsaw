# Confidential Computing and Confidential Containers on AWS EKS

*Options for approximating Edgeless Constellation's encrypted Kubernetes model on Amazon EKS*

## Bottom Line

You cannot fully reproduce Constellation's model on EKS, because EKS keeps the control plane (API server, etcd) on infrastructure AWS manages, outside any TEE you control. What you *can* do is make the data plane confidential. There are three realistic patterns; the third is the closest to what Constellation provides.

## What AWS Provides

- **SEV-SNP on shared tenancy:** Available in US East (Ohio) and Europe (Ireland), enabled with `--cpu-options AmdSevSnp=enabled` on supported AMD instance types (m6a, c6a, r6a).
- **SEV-SNP on Dedicated Hosts:** As of July 2026, available in all AWS commercial Regions with AMD instances.
- **Availability caveat:** "Commercial" Regions only. Verify GovCloud or isolated-region availability before designing around this.

**Trust caveat:** On AWS, the vTPM (NitroTPM) sits outside the TEE and is managed by the Nitro hypervisor, so the hypervisor is in the TCB for measured boot. The SNP attestation report itself is hardware-rooted. Constellation has the same limitation on AWS.

## Pattern 1: Confidential Nodes (simplest, weakest)

**How:** Create an EKS self-managed or managed node group whose launch template sets `CpuOptions.AmdSevSnp=enabled` on m6a/c6a/r6a instances, using an SNP-capable AMI (AL2023 or a custom Bottlerocket/Ubuntu build).

**What you get:** Each worker node's memory is encrypted from the host.

**Limitations:**
- The whole node is the trust boundary. Anyone with node-level access (SSH, kubelet) can reach every pod's memory.
- Attestation covers the node before any pod starts, so per-workload attestation is weak.

**Fit:** "Encrypt memory against the cloud operator," not "prove exactly what is running."

## Pattern 2: Confidential Pods via CNCF Confidential Containers (open source)

**How:** CNCF Confidential Containers (CoCo): Kata Containers plus Trustee for attestation and key release. Upstream CoCo already supports AWS SEV-SNP instances, using Trustee's standard SNP verifier.

Because EC2 generally cannot nest SNP guests inside an SNP VM, choose one of:

| Option | How it works | Trade-offs |
|---|---|---|
| **Peer pods** (cloud-api-adaptor, AWS provider) | Each confidential pod launches as its own SEV-SNP EC2 instance; the EKS node runs only the shim | Works on ordinary node groups; slower pod startup; one instance per pod |
| **Bare metal nodes** | Kata runs SNP micro-VMs directly on metal instances | Denser and faster; requires metal instance capacity |

**Key release:** Self-host Trustee (KBS plus attestation service) so secrets, image decryption keys, and disk keys are released only to pods whose SNP measurements match policy.

**Fit:** Fully open source and self-hosted; well suited to restricted environments.

## Pattern 3: Edgeless Contrast (closest to Constellation)

**What it is:** Edgeless Systems' open-source sibling to Constellation, built for managed Kubernetes. Runs pods inside confidential micro-VMs (Kata Containers with AMD SEV-SNP or Intel TDX). Lists Amazon EKS as a supported service.

**How:** Provision an EKS cluster with bare metal EC2 nodes that meet SEV-SNP hardware requirements, then annotate pods or deployments to run as confidential containers.

**What it adds beyond raw CoCo:**
- **Coordinator** that attests the entire deployment against a manifest
- **Generated Kata agent policies** so the kubelet and node administrators cannot tamper with pod specs
- **Attestation-based mTLS mesh** between confidential pods

**Fit:** Delivers Constellation's "verify the cluster, then trust it" experience, scoped to workloads rather than the whole cluster.

## Closing the Gaps Constellation Handles for You

| Concern | Recommended approach on EKS |
|---|---|
| **Secrets in etcd** | Enable EKS envelope encryption with KMS, but treat the control plane as untrusted. Deliver real secrets via Trustee or Contrast after attestation, not as Kubernetes Secrets. |
| **Network** | Cilium with WireGuard transparent encryption between nodes, or Contrast's mesh for pod-to-pod traffic. |
| **Storage** | Encrypt volumes inside the TEE (LUKS) with keys released by your KBS, rather than relying on EBS encryption, which AWS can decrypt. |
| **Key release gating** | AWS KMS attestation condition keys cover Nitro Enclaves, not SNP. Key release policy must live in Trustee or Vault, not IAM. |

## Decision Guide

- **Need the control plane inside the TEE?** Skip EKS and run Constellation directly on EC2 SEV-SNP instances.
- **Confidential data plane on managed Kubernetes is enough?** Use Contrast on bare metal EKS nodes.
- **Need a fully community-governed stack?** Use CoCo with peer pods or bare metal Kata, plus self-hosted Trustee.

## Sources

- [AWS: Launch an instance with AMD SEV-SNP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/snp-work-launch.html)
- [AWS: EC2 Dedicated Hosts now support AMD SEV-SNP (Jul 2026)](https://aws.amazon.com/about-aws/whats-new/2026/07/ec2-amd-sev-snp-dedicated-hosts)
- [Red Hat RFE-7008: CoCo on AWS SEV-SNP](https://issues.redhat.com/browse/RFE-7008)
- [Edgeless Contrast on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-s5ubacqa7gxf2)
- [Constellation docs: Feature status of clouds](https://docs.edgeless.systems/constellation/overview/clouds)
- [Anjuna: Confidential Nodes vs Confidential Pods](https://anjuna.io/blog/beyond-containers-anjuna-seaglass-pioneers-confidential-pods-in-azure-kubernetes-service)
