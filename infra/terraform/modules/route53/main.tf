# A-records in an existing hosted zone. Pass a map of record name -> IP.
# Example: { "lawmitran.com" = "1.2.3.4", "api.lawmitran.com" = "1.2.3.4" }

data "aws_route53_zone" "this" {
  name         = var.zone_name
  private_zone = false
}

resource "aws_route53_record" "a" {
  for_each = var.records

  zone_id = data.aws_route53_zone.this.zone_id
  name    = each.key
  type    = "A"
  ttl     = var.ttl
  records = [each.value]
}
