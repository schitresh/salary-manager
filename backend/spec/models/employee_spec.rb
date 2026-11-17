require 'rails_helper'

RSpec.describe Employee, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(build(:employee)).to be_valid
    end

    it 'requires core fields' do
      emp = build(:employee, employee_code: nil, first_name: nil, last_name: nil, email: nil,
                  phone: nil, date_of_birth: nil, date_of_joining: nil, job_title: nil, department: nil)
      expect(emp).not_to be_valid
      %i[employee_code first_name last_name email phone date_of_birth date_of_joining job_title department].each do |attr|
        expect(emp.errors[attr]).to be_present
      end
    end

    it 'normalizes email and strips fields' do
      emp = create(:employee, email: '  Person@Official.com  ', employee_code: '  E100  ')
      expect(emp.email).to eq('person@official.com')
      expect(emp.employee_code).to eq('E100')
    end

    it 'enforces uniqueness of employee_code, email, phone' do
      create(:employee, employee_code: 'E1', email: 'a@official.com', phone: '1111111111')
      dup = build(:employee, employee_code: 'e1', email: 'A@official.com', phone: '1111111111')
      expect(dup).not_to be_valid
      expect(dup.errors[:employee_code]).to be_present
      expect(dup.errors[:email]).to be_present
      expect(dup.errors[:phone]).to be_present
    end

    it 'requires employee to be at least 18 years old' do
      travel_to Date.new(2026, 1, 1) do
        emp = build(:employee, date_of_birth: Date.new(2010, 1, 1))
        expect(emp).not_to be_valid
        expect(emp.errors[:date_of_birth]).to be_present
      end
    end

    it 'allows employee who is exactly 18' do
      travel_to Date.new(2026, 1, 1) do
        emp = build(:employee, date_of_birth: Date.new(2008, 1, 1), date_of_joining: Date.new(2026, 1, 2))
        expect(emp).to be_valid
      end
    end

    it 'requires last_working_day to be after date_of_joining when present' do
      emp = build(:employee, date_of_joining: Date.new(2024, 1, 10), last_working_day: Date.new(2024, 1, 10))
      expect(emp).not_to be_valid
      expect(emp.errors[:last_working_day]).to be_present
    end

    it 'allows nil last_working_day' do
      emp = build(:employee, last_working_day: nil)
      expect(emp).to be_valid
    end
  end
end
