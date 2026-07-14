# Baseline CloudWatch: a log group for the CloudWatch agent, plus alarms for
# high CPU, instance status-check failure, and (optional) an SNS alert topic.

resource "aws_cloudwatch_log_group" "this" {
  name              = "/lawmitran/${var.name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_sns_topic" "alerts" {
  count = var.alert_email != null ? 1 : 0
  name  = "${var.name}-alerts"
  tags  = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != null ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

locals {
  alarm_actions = var.alert_email != null ? [aws_sns_topic.alerts[0].arn] : []
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description    = "CPU > 80% for 15 minutes"
  dimensions          = { InstanceId = var.instance_id }
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  tags                = var.tags
}

resource "aws_cloudwatch_metric_alarm" "status_check" {
  alarm_name          = "${var.name}-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description    = "Instance or system status check failed"
  dimensions          = { InstanceId = var.instance_id }
  alarm_actions       = local.alarm_actions
  tags                = var.tags
}
