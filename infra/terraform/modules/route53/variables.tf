variable "zone_name" {
  description = "Existing hosted zone name, e.g. lawmitran.com"
  type        = string
}

variable "records" {
  description = "Map of FQDN -> IPv4 address for A records"
  type        = map(string)
}

variable "ttl" {
  description = "Record TTL in seconds (low during rollout)"
  type        = number
  default     = 300
}
