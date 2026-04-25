---
term: skew
plain_definition: Skew describes the asymmetry of a data distribution, where one tail of the distribution stretches further from the peak than the other.
related_terms: ["Mean", "Median", "Standard Deviation", "Normal Distribution", "Outlier"]
common_confusion_with: ["Kurtosis", "Standard Deviation", "Correlation"]
school_usage:
  HGSE: "Common in educational assessment research, where test scores are often negatively skewed when most students perform well but a few struggle."
  HBS: "Typically used in analyzing financial performance metrics or market returns that frequently exhibit heavy right-skew."
  FAS: "Used in faculty or student surveys where satisfaction or sentiment ratings often show a strong negative skew toward positive responses."
  HMS: "Used during longitudinal health studies to describe clinical outcomes like length of hospital stay that rarely follow a perfectly symmetrical bell curve."
  SEAS: "Commonly encountered in experimental data or sensor measurements where physical constraints naturally produce skewed distributions."
version: 1
---

## Plain-language definition

Skew describes the asymmetry of a data distribution, where one tail of the distribution stretches further from the peak than the other. When a distribution is symmetric, it is balanced; when skewed, the bulk of the data sits on one side while a thin tail pulls the mean toward the longer side.

## What it tells you

Skew informs you about the 'direction' of extreme values. A positive (right) skew means the tail extends toward higher values, often caused by high earners or large gift amounts. A negative (left) skew means the tail extends toward lower values, often seen when most people score highly on an easy assessment.

## When it matters

Understanding skew is vital whenever you choose between the mean and the median. If your data is heavily skewed, the mean becomes a misleading indicator of the 'center,' as it is pulled by the tail. You should check for skew before deciding on the best statistical test, as many models assume data is normally distributed and will perform poorly with highly skewed inputs.

## Common confusion with Kurtosis

People often mistake skew for kurtosis. While skew measures the lopsidedness of the distribution (leaning left or right), kurtosis measures the 'tailedness'—how much of the data exists in the extreme ends compared to the center. You can have a perfectly symmetric distribution with high kurtosis (lots of outliers) or low kurtosis (few outliers).

## Example in context

A researcher looks at the distribution of annual donor contributions. Most donors give small amounts, but a few 'whales' give in the millions. The resulting data shows a heavy positive skew. The researcher realizes the mean donation is $10,000, which feels inflated because of those few massive gifts. They shift to using the median ($150) to represent the typical donor experience.

## Usage across Harvard

In administrative offices like those overseeing student financial aid, data analysts observe right-skew in household income variables. In behavioral labs at FAS, researchers look for negative skew in performance data to determine if an intervention hit a ceiling effect. At HBS and HMS, skew is a routine diagnostic check for any financial or clinical dataset before applying standard parametric statistics.

## Related terms

- **Mean** is the arithmetic average, which is pulled toward the direction of the skew.
- **Median** is the middle value, which remains robust despite the presence of skew.
- **Normal Distribution** is the 'bell curve' where skew is zero.
- **Outlier** is a value at the extreme end of a tail that contributes to skew.
- **Mode** is the most frequent value, which often sits on the opposite side of the mean in skewed data.
