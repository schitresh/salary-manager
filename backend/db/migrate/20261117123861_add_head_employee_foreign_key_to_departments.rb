class AddHeadEmployeeForeignKeyToDepartments < ActiveRecord::Migration[8.0]
  def change
    add_foreign_key :departments, :employees, column: :head_employee_id, on_delete: :nullify
  end
end
