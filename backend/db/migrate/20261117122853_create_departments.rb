class CreateDepartments < ActiveRecord::Migration[8.0]
  def change
    create_table :departments do |t|
      t.string :name, null: false
      t.references :location, null: false, foreign_key: true
      t.bigint :head_employee_id

      t.timestamps
    end

    add_index :departments, :name
    add_index :departments, :head_employee_id
    add_index :departments, [:name, :location_id], unique: true
  end
end
