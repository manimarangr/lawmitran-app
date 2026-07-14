output "zone_id" {
  value = data.aws_route53_zone.this.zone_id
}

output "record_names" {
  value = [for r in aws_route53_record.a : r.fqdn]
}
