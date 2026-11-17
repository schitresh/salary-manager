class Location < ApplicationRecord
  before_validation :normalize_attributes

  validates :city, :state_code, :country_code, presence: true
  validates :city, uniqueness: { scope: [:state_code, :country_code], case_sensitive: false }
  validate :country_code_must_be_valid
  validate :state_code_must_be_valid_for_country

  private

  def normalize_attributes
    self.city = city.to_s.strip.presence
    self.state_code = state_code.to_s.strip.upcase.presence
    self.country_code = country_code.to_s.strip.upcase.presence
  end

  def country_code_must_be_valid
    return if country_code.blank?
    return if Carmen::Country.coded(country_code).present?

    errors.add(:country_code, "is not a valid country code")
  end

  def state_code_must_be_valid_for_country
    return if country_code.blank? || state_code.blank?

    country = Carmen::Country.coded(country_code)
    return if country.blank?

    subregion = country.subregions.coded(state_code)
    errors.add(:state_code, "is not a valid state code for the selected country") if subregion.blank?
  end
end
