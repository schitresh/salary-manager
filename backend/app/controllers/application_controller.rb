class ApplicationController < ActionController::API
  respond_to :json

  before_action :authenticate_user_from_jwt!

  private

  # Ensure JWT-authenticated user is loaded for protected endpoints while
  # allowing public endpoints (e.g. health, auth) to opt out.
  def authenticate_user_from_jwt!
    return if current_user

    token = bearer_token
    return if token.blank?

    begin
      payload = Warden::JWTAuth::TokenDecoder.new.call(token)
      user = User.find_by(id: payload["sub"])
      return unless user
      return unless payload["jti"] == user.jti

      warden.set_user(user, scope: :user, store: false)
    rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError
      nil
    end
  end

  def current_user
    @current_user ||= warden.user(:user)
  end

  def bearer_token
    header = request.headers["Authorization"].to_s
    header.split(" ", 2).last if header.start_with?("Bearer ")
  end

  def authenticate_user!
    return if current_user

    render_error("Unauthorized", status: :unauthorized)
  end

  # --- Response helpers ---
  def render_error(message, status: :unprocessable_content)
    render json: { error: message }, status: status
  end

  def render_errors(errors, status: :unprocessable_content)
    messages = errors.respond_to?(:full_messages) ? errors.full_messages : Array(errors)
    render json: { errors: messages }, status: status
  end

  def render_message(message, status: :ok)
    render json: { message: message }, status: status
  end

  def render_not_found(resource = "Resource")
    render_error("#{resource} not found", status: :not_found)
  end

  # --- Serialization ---
  def serialize_record(record, attributes)
    attributes.index_with { |attr| record.public_send(attr) }
  end

  def serialize_collection(records, attributes)
    records.map { |record| serialize_record(record, attributes) }
  end

  # --- Pagination ---
  # Expects params in the form page[number] and page[size]
  def paginate(scope, default_size: 25, max_size: 100)
    page_number = params.dig(:page, :number).to_i
    page_number = 1 if page_number < 1

    page_size = params.dig(:page, :size).to_i
    page_size = default_size if page_size < 1
    page_size = max_size if page_size > max_size

    total = scope.count
    records = scope.offset((page_number - 1) * page_size).limit(page_size)
    meta = { page: { number: page_number, size: page_size }, total: total }

    [records, meta]
  end

  # --- Filters ---
  # Applies common filter[...] params:
  # - exact: exact match on column (value stripped)
  # - exact_upcase: exact match with uppercased value (e.g. codes)
  # - partial: case-insensitive contains match
  def apply_query_filters(scope, exact: [], exact_upcase: [], partial: [])
    filters = params.fetch(:filter, {})

    Array(exact).each do |field|
      value = filters[field]
      next if value.blank?

      scope = scope.where(field => value.to_s.strip)
    end

    Array(exact_upcase).each do |field|
      value = filters[field]
      next if value.blank?

      scope = scope.where(field => value.to_s.strip.upcase)
    end

    Array(partial).each do |field|
      value = filters[field]
      next if value.blank?

      scope = scope.where("LOWER(#{scope.table_name}.#{field}) LIKE ?", "%#{value.to_s.strip.downcase}%")
    end

    scope
  end
end
