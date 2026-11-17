require "money"

class Salary < ApplicationRecord
  FREQUENCY_MONTH = "month".freeze

  belongs_to :employee
  belongs_to :department

  before_validation :normalize_and_compute

  validates :applicable_from, :job_title, :currency, :employee, :department, :frequency, presence: true
  validates :base_amount, :total_amount, presence: true
  validates :frequency, inclusion: { in: [FREQUENCY_MONTH] }
  validates :base_amount, numericality: { greater_than: 0 }
  validates :hra_amount, :bonus_amount, :deduction_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :currency, length: { is: 3 }, allow_blank: true
  validate :currency_must_be_valid
  validate :applicable_till_after_from
  validate :applicable_from_on_or_after_joining
  validate :no_overlapping_salary_period

  before_create :auto_close_previous_open_salary

  private

  def normalize_and_compute
    self.job_title = job_title.to_s.strip.presence
    self.currency = currency.to_s.strip.upcase.presence
    self.frequency = FREQUENCY_MONTH if frequency.blank?

    self.hra_amount = 0 if hra_amount.nil?
    self.bonus_amount = 0 if bonus_amount.nil?
    self.deduction_amount = 0 if deduction_amount.nil?

    if base_amount.present?
      self.total_amount = base_amount.to_d + hra_amount.to_d + bonus_amount.to_d - deduction_amount.to_d
    end
  end

  def currency_must_be_valid
    return if currency.blank?
    return if Money::Currency.find(currency)

    errors.add(:currency, "is not a valid currency code")
  end

  def applicable_till_after_from
    return if applicable_from.blank? || applicable_till.blank?

    if applicable_till <= applicable_from
      errors.add(:applicable_till, "must be after applicable from")
    end
  end

  def applicable_from_on_or_after_joining
    return if applicable_from.blank? || employee.blank? || employee.date_of_joining.blank?

    if applicable_from < employee.date_of_joining
      errors.add(:applicable_from, "must be on or after employee's date of joining")
    end
  end

  def no_overlapping_salary_period
    return if employee_id.blank? || applicable_from.blank?

    others = Salary.where(employee_id: employee_id)
    others = others.where.not(id: id) if persisted?

    this_from = applicable_from
    this_till = applicable_till

    others.find_each do |other|
      next if will_auto_close_other?(other)

      other_from = other.applicable_from
      other_till = other.applicable_till
      next if other_from.blank?

      if periods_overlap?(this_from, this_till, other_from, other_till)
        errors.add(:base, "salary period overlaps with an existing salary record")
        break
      end
    end
  end

  def will_auto_close_other?(other)
    new_record? && other.applicable_till.nil?
  end

  def periods_overlap?(from_a, till_a, from_b, till_b)
    end_a = till_a || Date.new(9999, 12, 31)
    end_b = till_b || Date.new(9999, 12, 31)
    from_a <= end_b && from_b <= end_a
  end

  def auto_close_previous_open_salary
    return unless employee_id && applicable_from

    previous_open = Salary.where(employee_id: employee_id, applicable_till: nil)
    previous_open = previous_open.where.not(id: id) if persisted?
    previous = previous_open.order(applicable_from: :desc).first
    return unless previous

    close_date = applicable_from - 1.day
    if close_date <= previous.applicable_from
      errors.add(:applicable_from, "cannot auto-close previous salary: new applicable from must be after previous salary's applicable from")
      throw :abort
    end

    unless previous.update(applicable_till: close_date)
      errors.add(:base, "could not close previous open salary: #{previous.errors.full_messages.join(', ')}")
      throw :abort
    end
  end
end
