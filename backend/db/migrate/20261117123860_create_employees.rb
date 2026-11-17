class CreateEmployees < ActiveRecord::Migration[8.0]
  def change
    create_table :employees do |t|
      t.string :employee_code, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :phone, null: false
      t.date :date_of_birth, null: false
      t.date :date_of_joining, null: false
      t.date :last_working_day
      t.string :job_title, null: false
      t.references :department, null: false, foreign_key: true

      t.timestamps
    end

    add_index :employees, :employee_code, unique: true
    add_index :employees, :email, unique: true
    add_index :employees, :phone, unique: true
    add_index :employees, :job_title
    add_index :employees, :date_of_joining
  end
end
