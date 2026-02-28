Password Hashing Security — Design & Protection Model
Overview

This document explains how the PasswordHasher implementation protects user credentials within the system.

The implementation uses:

crypto.scrypt (Node.js built-in)

Random per-user salt

Constant-time comparison via timingSafeEqual

The design goal is:

Ensure stored passwords cannot be reversed, efficiently brute-forced, or exploited via timing attacks.

1. High-Level Security Model

Passwords are never encrypted and never stored in plaintext.

Instead:

A cryptographically secure random salt is generated.

The password is processed using scrypt, a memory-hard Key Derivation Function (KDF).

The result is stored as:

salt:derivedHash

During login:

The stored salt is extracted.

scrypt is executed again with the candidate password.

The derived value is compared using constant-time comparison.

No reversible transformation exists.

2. Protection Mechanisms
2.1 Use of scrypt (Memory-Hard KDF)
What it protects against

Offline brute-force attacks

GPU-accelerated cracking

Large-scale password dictionary attacks

Why not SHA256?

Fast hash algorithms (e.g., SHA256):

Are designed for speed.

Allow millions of attempts per second.

Are unsafe for password storage.

scrypt is intentionally slow and memory-intensive.

This means:

Each password guess is computationally expensive.

Attacks become economically and temporally costly.

Parallelization on GPUs is less efficient.

Security Effect

If a database is leaked, attackers cannot efficiently test billions of passwords.

2.2 Per-Password Random Salt

Each password is hashed with:

randomBytes(16)
What it protects against

Rainbow table attacks

Identical hash detection across users

Precomputed dictionary attacks

Without salt:

Two users with the same password → identical hash.

Precomputed lookup tables become viable.

With salt:

Same password → different hash per user.

Attackers must crack each hash independently.

Important Note

The salt is not secret.

Its purpose is uniqueness, not secrecy.

2.3 64-Byte Derived Key

scrypt(password, salt, 64)

This produces:

64 bytes (512 bits)

High entropy output

Large search space

This increases brute-force complexity.

2.4 Constant-Time Comparison (timingSafeEqual)

Password verification uses:

timingSafeEqual(storedHashBuffer, derivedKey)
What it protects against

Timing attacks

Byte-by-byte inference of correct values

Normal comparison:

Stops at first mismatch.

Response time varies.

Attackers can measure timing differences.

Constant-time comparison:

Always compares all bytes.

Response time remains consistent.

No partial information is leaked.

Security Effect

Prevents attackers from reconstructing hashes via time measurement.

3. Attack Resistance Summary
Attack Type	Protection Level	Mechanism
Plaintext exposure	Fully mitigated	No plaintext storage
Reversible encryption attack	Not applicable	Hashing is one-way
Rainbow tables	Mitigated	Unique salt
GPU brute-force	Strongly reduced	Memory-hard KDF
Timing attack	Mitigated	timingSafeEqual
Hash comparison leakage	Mitigated	Constant-time comparison
4. What This Does NOT Protect Against

Security is layered. This component does NOT protect against:

Weak user passwords

Credential stuffing attacks

Rate-limit bypass

Database compromise

JWT compromise

Application-level vulnerabilities

Password hashing only protects stored credentials.

Other layers must handle:

Rate limiting

Account lockout

Secure authentication flows

Transport encryption (HTTPS)

5. Security Posture Assessment

For a small production backend:

This implementation is appropriate.

It uses modern, industry-accepted primitives.

It does not rely on external dependencies.

It resists realistic attacks from moderately skilled adversaries.

It is suitable for:

Early production systems

Controlled user bases

Standard web authentication use cases

6. Design Philosophy

The design follows three principles:

Irreversibility — Passwords cannot be decrypted.

Cost Amplification — Each guess is expensive.

Information Minimization — No partial leakage via timing.

The objective is not absolute theoretical invulnerability.

The objective is:

Make credential compromise economically and practically unviable under realistic threat models.