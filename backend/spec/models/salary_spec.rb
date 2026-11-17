require 'rails_helper'

RSpec.describe Salary, type: :model do
  let(:employee) { create(:employee, date_of_joining: Date.new(2024, 1, 1), job_title: 'Engineer') }
  let(:department) { employee.department }

  describe 'validations and calculations' do
    it 'is valid with valid attributes and computes total_amount' do
      salary = build(:salary, employee: employee, department: department,
                     base_amount: 10000, hra_amount: 2000, bonus_amount: 500, deduction_amount: 300,
                     applicable_from: Date.new(2024, 1, 1), currency: 'INR')
      expect(salary).to be_valid
      salary.save!
      expect(salary.total_amount).to eq(BigDecimal('12200.00'))
      expect(salary.frequency).to eq('month')
    end

    it 'requires base_amount > 0 and other components >= 0' do
      salary = build(:salary, employee: employee, department: department, base_amount: 0,
                     hra_amount: -1, bonus_amount: -1, deduction_amount: -1)
      expect(salary).not_to be_valid
      expect(salary.errors[:base_amount]).to be_present
      expect(salary.errors[:hra_amount]).to be_present
      expect(salary.errors[:bonus_amount]).to be_present
      expect(salary.errors[:deduction_amount]).to be_present
    end

    it 'validates currency code' do
      salary = build(:salary, employee: employee, department: department, currency: 'XXX')
      expect(salary).not_to be_valid
      expect(salary.errors[:currency]).to be_present
    end

    it 'requires applicable_till after applicable_from' do
      salary = build(:salary, employee: employee, department: department,
                     applicable_from: Date.new(2024, 2, 1), applicable_till: Date.new(2024, 2, 1))
      expect(salary).not_to be_valid
      expect(salary.errors[:applicable_till]).to be_present
    end

    it 'requires applicable_from on or after employee date_of_joining' do
      salary = build(:salary, employee: employee, department: department,
                     applicable_from: Date.new(2023, 12, 31))
      expect(salary).not_to be_valid
      expect(salary.errors[:applicable_from]).to be_present
    end
  end

  describe 'period rules' do
    it 'rejects overlapping salary periods for the same employee' do
      create(:salary, employee: employee, department: department,
             applicable_from: Date.new(2024, 1, 1), applicable_till: Date.new(2024, 6, 30))
      overlap = build(:salary, employee: employee, department: department,
                      applicable_from: Date.new(2024, 6, 1), applicable_till: Date.new(2024, 12, 31))
      expect(overlap).not_to be_valid
      expect(overlap.errors[:base]).to include(/overlaps/i)
    end

    it 'auto-closes previous open-ended salary on create' do
      prev = create(:salary, employee: employee, department: department,
                    applicable_from: Date.new(2024, 1, 1), applicable_till: nil)
      new_salary = create(:salary, employee: employee, department: department,
                          applicable_from: Date.new(2024, 7, 1), applicable_till: nil, base_amount: 15000)

      expect(prev.reload.applicable_till).to eq(Date.new(2024, 6, 30))
      expect(new_salary.applicable_till).to be_nil
    end

    it 'rejects create when auto-close would be invalid for previous record' do
      prev = create(:salary, employee: employee, department: department,
                    applicable_from: Date.new(2024, 1, 10), applicable_till: nil)
      bad = build(:salary, employee: employee, department: department,
                  applicable_from: Date.new(2024, 1, 10), applicable_till: nil)

      expect(bad.save).to be_falsey
      expect(bad.errors.full_messages.join(' ')).to match(/auto-close|overlap|applicable/i)
      expect(prev.reload.applicable_till).to be_nil
    end
  end
end
