# Contributing to Touchstone

Touchstone is an open standard for turning a card condition assessment into a
repeatable grade. The standard is in the math, the measurements, and the
schema. We hope to shepherd a standard used by collectors, hobbyists, vendors,
and companies. Contributions and criticism are welcome.

If you want to join as a maintainer, email committers@touchstonestandard.org.

Run `npm test` before you open a pull request. The conformance vectors are the
gate: a frozen set of inputs paired with the exact output every implementation
has to reproduce. If your change moves a number, a vector will say so.

## Sign off on your commits

Every commit needs a `Signed-off-by:` line. Git will add one for you:

```
git commit -s -m "your message"
```

If you forget, `git commit --amend -s` and force-push the branch. Commits
without a sign-off can't be merged.

The sign-off is the [Developer Certificate of
Origin](https://developercertificate.org/), version 1.1: a short statement that
you wrote the change, or otherwise have the right to submit it under this
project's licence. Not a copyright assignment, not a CLA. You keep your
copyright.

We use a DCO rather than a contributor licence agreement on purpose. It buys
you three things. We acquire no rights in your contribution that you and every
third party do not equally hold. Nothing we have already published can be taken
back. Any fork starts on exactly the footing we stand on.

It does not, by itself, guarantee that this project's licence can never change.
We are not going to claim that it does. What is promised, and what binds, is in
the licensing commitment below.

## Licensing

- **Apache-2.0** - the code (`scoring.mjs` and any other source), the JSON
  Schemas in `schemas/`, the conformance vectors in `test/`, the rubric data,
  and the normative specification text in `RUBRIC.md`.
- **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** - explainer
  prose: documentation that describes the standard rather than defining it.

Where a file doesn't say which one applies, it is Apache-2.0. The full text is
in `LICENSE`.

**Trademarks are not licensed.** Apache-2.0 §6 grants no rights in the
licensor's trade names, trademarks, or service marks, and nothing here grants
them separately.

Against that, one commitment. You may state that your implementation conforms
to Touchstone, naming the version it passes: `conforms to Touchstone 0.1`. We
will not assert our marks against an accurate claim of that form. Name the
version. Conformance is defined per version — it means passing that version's
vectors in `test/` — and a bare "Touchstone conformant" with nothing behind it
is a claim we would treat as inaccurate.

This holds even if we later run a paid certification programme. Certification
would attest that we checked. It would never become the price of accurately
reporting a result you can reproduce yourself by running the vectors.

You do need written permission to use the Touchstone name as the name or
branding of your own product, or in any way that suggests we endorse,
certify, or stand behind it. Ask first. Open an issue.

## The licensing commitment

Four things are covered: the specification (`RUBRIC.md`), the rubric data, the
JSON Schemas, and the conformance vectors. They remain permanently under a
licence that never imposes obligations on your work merely because that work
conforms to, or tests against, this standard. In practice: Apache-2.0, MIT,
BSD, or CC BY 4.0. That rules out non-commercial and no-derivatives terms, and
it rules out copyleft and share-alike terms just as firmly. The schemas are
meant to be embedded in your product and the vectors are meant to run inside
your test suite. A licence that attached conditions to your code or your
internal documentation for doing either would defeat the point of publishing
them at all.

This commitment may be broadened but never narrowed. It is the one part of this
document the amendment rule under Governance does not reach, and it cannot be
changed by the proposal process below.

The reference implementation (`scoring.mjs`) is deliberately not covered. Its
licence may change, with twelve months' notice and a final release under the
prior terms. Notice means a dated entry in this file, repeated on the releases
page and the package registry listing. Contributions are accepted on the
ordinary terms throughout the notice period, and the final release under the
prior licence is of the tree as it stands at the end of that period, not as it
stood on the day notice was given.

A promise is worth what the party behind it is worth. This commitment is made
by Grailology, LLC. It does not bind an acquirer and it does not survive the
company's wind-down.

**The Apache-2.0 grants already made are irrevocable.** Every version published
to date can be used, modified, redistributed, and forked by anyone, forever,
regardless of anything we later decide and regardless of who ends up owning
Grailology. That part does not depend on trusting us. If this project goes
somewhere you won't follow, that is the floor you land on. It is the one thing
here that needs no good faith from us at all.

None of this obliges us to keep working on Touchstone. We could hold every
published version open exactly as promised, stop development, and let the
standard go stale, and every word above would still be true. That is the honest
risk of adopting a standard with one maintainer. You should price it in rather
than take comfort from this section. The half we can close, we close. If we
publish a successor standard, it goes out under these same terms. We will not
freeze this one and reintroduce it as a product.

That is the entire commitment. It is deliberately narrow. We would rather give
you a promise we can be held to than a bigger one we can't.

## Proposing a change

Typos, a broken link, tooling, a number the vectors already contradict. Just
open a pull request.

Anything that changes what a conforming implementation must do goes through a
**TIP**, a Touchstone Improvement Proposal:

1. Open a pull request that adds one file to `proposals/`.
2. Once the pull request has a number, rename the file to match it:
   `proposals/0042-binding-region-tiebreak.md`.
3. Write these five sections, in this order:
   - **Motivation** - what is wrong today, with a card that shows it.
   - **Specification** - the normative change, precise enough to implement
     from without reading the discussion.
   - **Rationale and Alternatives** - why this shape, and what you rejected.
   - **Backward Compatibility** - which previously valid inputs score
     differently, and what implementers have to do about it.
   - **Reference Implementation** - the change to `scoring.mjs` and the rubric
     data.

No proposal reaches final without both a reference implementation and a
conformance vector: at least one vector that tells the new behaviour apart from
the old. Agreement in the thread is not the bar. Running code and a vector that
pins it are.

## Governance

A company stewarding an open standard it wrote is the normal starting point,
not an anomaly. Most standards worth adopting began this way and moved to a
foundation later, once enough people depended on them that neutral governance
was worth the overhead. That is the path we expect to follow, and a foundation
ratifies adoption rather than creating it, so it is not a step we can usefully
take today.

Touchstone is stewarded by Grailology, LLC, and it has one maintainer today.
That maintainer decides every proposal alone, and works for a company that
builds commercial products on Touchstone and is entering the card grading and
authentication market. That makes the steward a direct competitor of many of
the labs and tools most likely to adopt Touchstone. That is a real conflict of
interest, not a disclosure formality. Weigh it before you build on this. It is
here because a standard whose steward hides its position in the market is not
worth adopting.

Proposals are decided by the Chair, in the pull request, in writing, with
reasons stated. When the project has three or more maintainers, decisions move
to maintainer consensus, with the Chair holding a tie-break and a veto that
must be publicly justified.

There is one maintainer because the project is new and nobody has asked to be
another. That is the reason, not a preference. We want more, and we want them
from outside Grailology most of all, because a standard maintained only by the
company that sells against it is worth less to everyone including us. The path
is the ordinary one: contribute, keep contributing, and say you want it. There
is no committee to get past.

We won't invite lightly. A maintainer's judgement decides what every
implementation of this standard has to do, and a grade computed under it is
someone's money. So the bar is sustained work rather than one good pull
request, and we would rather leave a seat empty than fill it to look open.
If you're serious, so are we.

Until then, be clear about where that leaves you. Maintainers are appointed by
the Chair. There is no independence requirement. That three-maintainer
threshold counts maintainers, not independent ones, so reaching it does not by
itself put anyone from outside Grailology in the room. Once there is more than
one, each maintainer is listed with their affiliation, so you can check that
rather than infer it from a count.

We intend to rotate the Chair rather than hold it indefinitely. We are not
putting a date on that, because a rotation among one person is theatre and the
prerequisite is a standard enough people rely on that the seat is worth having.
That is the work. Help us do it.

This document is amended by the process it describes, with one exception. The
licensing commitment above may be broadened but never narrowed, and this
process cannot reach it.
