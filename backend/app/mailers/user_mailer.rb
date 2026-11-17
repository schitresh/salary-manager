class UserMailer < ApplicationMailer
  def invitation_instructions
    @user = params[:user]
    @token = params[:token]
    @frontend_url = Rails.configuration.x.frontend_base_url
    @accept_url = "#{@frontend_url}/invitation/accept?invitation_token=#{@token}"
    mail(to: @user.email, subject: "You're invited to Salary Manager")
  end

  def reset_password_instructions
    @user = params[:user]
    @token = params[:token]
    @frontend_url = Rails.configuration.x.frontend_base_url
    @reset_url = "#{@frontend_url}/password/reset?reset_password_token=#{@token}"
    mail(to: @user.email, subject: "Reset your Salary Manager password")
  end
end
