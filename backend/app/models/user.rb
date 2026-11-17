class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :recoverable, :rememberable,
         :validatable, :trackable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: /\A[^@\s]+@official\.com\z/i, message: "must end with @official.com" }

  before_create :set_jti

  private

  def set_jti
    self.jti ||= SecureRandom.uuid
  end
end
