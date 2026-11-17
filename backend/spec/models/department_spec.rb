require 'rails_helper'

RSpec.describe Department, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(build(:department)).to be_valid
    end

    it 'requires name and location' do
      dept = build(:department, name: nil, location: nil)
      expect(dept).not_to be_valid
      expect(dept.errors[:name]).to be_present
      expect(dept.errors[:location]).to be_present
    end

    it 'normalizes name' do
      dept = create(:department, name: '  Engineering  ')
      expect(dept.name).to eq('Engineering')
    end

    it 'enforces uniqueness of name scoped to location (case-insensitive)' do
      location = create(:location)
      create(:department, name: 'Engineering', location: location)
      dup = build(:department, name: 'engineering', location: location)
      expect(dup).not_to be_valid
      expect(dup.errors[:name]).to be_present
    end

    it 'allows same name in different locations' do
      loc1 = create(:location, city: 'Pune', state_code: 'MH', country_code: 'IN')
      loc2 = create(:location, city: 'Mumbai', state_code: 'MH', country_code: 'IN')
      create(:department, name: 'Engineering', location: loc1)
      other = build(:department, name: 'Engineering', location: loc2)
      expect(other).to be_valid
    end
  end
end
