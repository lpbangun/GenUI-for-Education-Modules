---
term: binomial
plain_definition: The binomial distribution describes the probability of achieving a specific number of successes in a fixed set of independent, binary trials.
related_terms: ["Bernoulli trial", "Probability mass function", "Normal approximation", "Confidence interval"]
common_confusion_with: ["Normal distribution", "Multinomial distribution", "Poisson distribution"]
school_usage:
  HGSE: "Commonly used in psychometric studies to model the likelihood of correct responses on binary assessment items."
  HBS: "Typically used in behavioral economics experiments where participants make one of two choices across a series of rounds."
  FAS: "Frequently applied in biology labs to determine the probability of a specific genetic trait appearing in a sample population."
  HMS: "Often used in clinical trials to estimate the likelihood of a binary patient outcome, such as recovery versus no recovery."
  SEAS: "Used in computational modeling to estimate the success rate of algorithms tested against a series of pass or fail inputs."
version: 1
---

## Plain-language definition
The binomial distribution describes the probability of achieving a specific number of successes in a fixed set of independent, binary trials.

## What it tells you
It provides a way to calculate the odds of a specific outcome frequency when every attempt is independent and only has two possible results. It assumes the probability of success remains constant across all trials.

## When it matters
Use the binomial distribution when you need to answer questions about 'how many' successes will occur in a known number of attempts. It is the foundation for analyzing:
- Success rates in admissions processes with binary outcomes.
- The probability of a student getting a certain number of questions right by guessing.
- The likelihood of clinical treatment success across a small group of participants.
- Quality control checks where a sample passes or fails a specific requirement.

## Common confusion with the normal distribution
Staff often mistake the binomial for the normal distribution because, with a large enough sample, the two distributions start to look similar. However, the binomial is strictly for discrete, binary outcomes, whereas the normal distribution describes continuous data. Using a normal approximation for a small sample size can result in highly inaccurate probability estimates.

## Example in context
An admissions office wants to know the probability that exactly 5 out of 10 randomly selected applications will meet a specific criteria. By assuming each application has an independent probability of success based on historical data, the binomial distribution provides the precise statistical likelihood for that specific '5 out of 10' scenario.

## Usage across Harvard
At HGSE and HBS, outcome reports for graduating cohorts typically lead with the median salary because graduate outcomes often skew right. In clinical research at HMS, median survival time is the standard summary for time-to-event data because the mean can be undefined when patients are still alive at study end. Institutional research reports on giving or compensation at the central level generally include both, though the median is the more informative number in both cases.

## Related terms
- **Bernoulli trial**: A single experiment with two outcomes. The building block of the binomial distribution.
- **Probability mass function**: The calculation method used to find the probability of a specific outcome in a binomial setup.
- **Normal approximation**: Using a bell curve to estimate binomial results when the number of trials is very large.
- **Confidence interval**: Used to quantify the uncertainty surrounding the estimated probability of success.
