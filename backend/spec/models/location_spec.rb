require 'rails_helper'

RSpec.describe Location, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(build(:location, city: 'Pune', state_code: 'MH', country_code: 'IN')).to be_valid
    end

    it 'requires city, state_code, and country_code' do
      location = build(:location, city: nil, state_code: nil, country_code: nil)
      expect(location).not_to be_valid
      expect(location.errors[:city]).to be_present
      expect(location.errors[:state_code]).to be_present
      expect(location.errors[:country_code]).to be_present
    end

    it 'normalizes state_code and country_code' do
      location = create(:location, city: ' Pune ', state_code: 'mh', country_code: 'in')
      expect(location.city).to eq('Pune')
      expect(location.state_code).to eq('MH')
      expect(location.country_code).to eq('IN')
    end

    it 'enforces uniqueness of city, state_code, country_code (case-insensitive on city)' do
      create(:location, city: 'Pune', state_code: 'MH', country_code: 'IN')
      dup = build(:location, city: 'pune', state_code: 'MH', country_code: 'IN')
      expect(dup).not_to be_valid
      expect(dup.errors[:city]).to be_present
    end

    it 'rejects invalid country code' do
      location = build(:location, country_code: 'XX', state_code: 'MH')
      expect(location).not_to be_valid
      expect(location.errors[:country_code]).to be_present
    end

    it 'rejects invalid state code for country' do
      location = build(:location, country_code: 'IN', state_code: 'CA')
      expect(location).not_to be_valid
      expect(location.errors[:state_code]).to be_present
    end
  end
end
