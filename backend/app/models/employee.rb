class Employee < ApplicationRecord
  belongs_to :department
  has_one :location, through: :department
  has_many :salaries

  before_validation :normalize_attributes

  validates :employee_code, :first_name, :last_name, :email, :phone,
            :date_of_birth, :date_of_joining, :job_title, :department, presence: true
  validates :employee_code, uniqueness: { case_sensitive: false }
  validates :email, uniqueness: { case_sensitive: false }
  validates :phone, uniqueness: true
  validate :date_of_birth_must_be_at_least_18
  validate :last_working_day_must_be_after_joining

  private

  def normalize_attributes
    self.employee_code = employee_code.to_s.strip.presence
    self.first_name = first_name.to_s.strip.presence
    self.last_name = last_name.to_s.strip.presence
    self.email = email.to_s.strip.downcase.presence
    self.phone = phone.to_s.strip.presence
    self.job_title = job_title.to_s.strip.presence
  end

  def date_of_birth_must_be_at_least_18
    return if date_of_birth.blank?

    if date_of_birth > 18.years.ago.to_date
      errors.add(:date_of_birth, "must be at least 18 years ago")
    end
  end

  def last_working_day_must_be_after_joining
    return if last_working_day.blank? || date_of_joining.blank?

    if last_working_day <= date_of_joining
      errors.add(:last_working_day, "must be after date of joining")
    end
  end
end
