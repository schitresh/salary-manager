class CreateSalaries < ActiveRecord::Migration[8.0]
  def change
    create_table :salaries do |t|
      t.date :applicable_from, null: false
      t.date :applicable_till
      t.string :job_title, null: false
      t.string :currency, null: false
      t.decimal :base_amount, precision: 12, scale: 2, null: false
      t.decimal :hra_amount, precision: 12, scale: 2, null: false, default: 0
      t.decimal :bonus_amount, precision: 12, scale: 2, null: false, default: 0
      t.decimal :deduction_amount, precision: 12, scale: 2, null: false, default: 0
      t.decimal :total_amount, precision: 12, scale: 2, null: false
      t.string :frequency, null: false, default: "month"
      t.references :employee, null: false, foreign_key: true
      t.references :department, null: false, foreign_key: true

      t.timestamps
    end

    add_index :salaries, :applicable_from
    add_index :salaries, :applicable_till
    add_index :salaries, :job_title
    add_index :salaries, :currency
    add_index :salaries, [:employee_id, :applicable_from]
  end
end
