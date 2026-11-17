module V1
  class AnalyticsController < ApplicationController
    before_action :authenticate_user!

    def show
      scope = current_salary_scope
      scope = apply_analytics_filters(scope)

      currencies = scope.distinct.pluck(:currency).compact
      if currencies.length > 1
        return render_error(
          "Multiple currencies found in the filtered salaries. Please filter to a single currency.",
          status: :unprocessable_content
        )
      end

      if currencies.empty?
        return render json: {
          analytics: {
            currency: nil,
            count: 0,
            total: format_money_value(0),
            average: nil,
            median: nil
          }
        }
      end

      amounts = scope.order(:total_amount).pluck(:total_amount).map(&:to_d)
      count = amounts.length
      total = amounts.sum
      average = count.positive? ? (total / count) : nil
      median = compute_median(amounts)

      render json: {
        analytics: {
          currency: currencies.first,
          count: count,
          total: format_money_value(total),
          average: average.nil? ? nil : format_money_value(average),
          median: median.nil? ? nil : format_money_value(median)
        }
      }
    end

    private

    def current_salary_scope
      today = Date.current
      Salary.where(
        "salaries.applicable_from <= ? AND (salaries.applicable_till IS NULL OR salaries.applicable_till >= ?)",
        today,
        today
      )
    end

    def apply_analytics_filters(scope)
      scoped = scope.joins(department: :location)
      apply_query_filters(
        scoped,
        exact: { department_id: "salaries.department_id", location_id: "locations.id" },
        exact_upcase: { country_code: "locations.country_code", state_code: "locations.state_code" },
        partial: { city: "locations.city", job_title: "salaries.job_title" }
      )
    end

    def compute_median(sorted_amounts)
      return nil if sorted_amounts.empty?

      mid = sorted_amounts.length / 2
      if sorted_amounts.length.odd?
        sorted_amounts[mid]
      else
        (sorted_amounts[mid - 1] + sorted_amounts[mid]) / 2
      end
    end

    def format_money_value(value)
      format("%.2f", value.to_d)
    end
  end
end
