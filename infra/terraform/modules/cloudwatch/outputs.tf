output "log_group_name" {
  value = aws_cloudwatch_log_group.this.name
}

output "alerts_topic_arn" {
  value       = var.alert_email != null ? aws_sns_topic.alerts[0].arn : null
  description = "SNS topic for alarms (null if no alert_email)"
}
