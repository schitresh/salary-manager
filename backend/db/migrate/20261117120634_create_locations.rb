class CreateLocations < ActiveRecord::Migration[8.0]
  def change
    create_table :locations do |t|
      t.string :city, null: false
      t.string :state_code, null: false
      t.string :country_code, null: false

      t.timestamps
    end

    add_index :locations, :state_code
    add_index :locations, :country_code
    add_index :locations, [:city, :state_code, :country_code], unique: true
  end
end
