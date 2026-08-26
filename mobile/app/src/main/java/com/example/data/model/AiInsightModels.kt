package com.example.data.model

data class AnalyticsPoint(
    val label: String,
    val value: Int,
    val intensity: Float
)

data class ScrumBriefing(
    val title: String,
    val summary: String,
    val highlights: List<String>,
    val suggestedNextAction: String,
    val blockersCount: Int,
    val hoursInCode: Float,
    val pullRequestsReviewed: Int,
    val buildSuccessRate: String = "99.4%",
    val contextSwitchScore: String = "Low (Optimal)"
)

data class WellnessBriefing(
    val hydrationStatus: String,
    val hydrationPercentage: Int,
    val stretchRecommendation: String,
    val pomodorosCompleted: Int,
    val eyeStrainAlert: String,
    val wellnessScore: Int
)

data class AiInsightsData(
    val dateLabel: String,
    val scrum: ScrumBriefing,
    val wellness: WellnessBriefing,
    val weeklyFocusAvg: Int,
    val weeklyGrowthPercent: Int,
    val peakFocusWindow: String,
    val hourlyDistribution: List<AnalyticsPoint>,
    val categoryPercentages: Map<String, Float>,
    val teamVelocityIndex: Int = 94,
    val contextSwitchAlert: String = "Context switching remains below 4 events/hour (Top 5% Engineering Benchmark)."
)
