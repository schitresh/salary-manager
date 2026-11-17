class Department < ApplicationRecord
  belongs_to :location

  before_validation :normalize_attributes

  validates :name, :location, presence: true
  validates :name, uniqueness: { scope: :location_id, case_sensitive: false }

  private

  def normalize_attributes
    self.name = name.to_s.strip.presence
  end
end
