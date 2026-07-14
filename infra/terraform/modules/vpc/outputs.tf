output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = [for s in aws_subnet.public : s.id]
}

output "public_subnet_id" {
  description = "First public subnet (single-instance environments)"
  value       = values(aws_subnet.public)[0].id
}
