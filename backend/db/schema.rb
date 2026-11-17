# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_11_17_122853) do
  create_table "departments", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "location_id", null: false
    t.bigint "head_employee_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["head_employee_id"], name: "index_departments_on_head_employee_id"
    t.index ["location_id"], name: "index_departments_on_location_id"
    t.index ["name", "location_id"], name: "index_departments_on_name_and_location_id", unique: true
    t.index ["name"], name: "index_departments_on_name"
  end

  create_table "locations", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "city", null: false
    t.string "state_code", null: false
    t.string "country_code", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["city", "state_code", "country_code"], name: "index_locations_on_city_and_state_code_and_country_code", unique: true
    t.index ["country_code"], name: "index_locations_on_country_code"
    t.index ["state_code"], name: "index_locations_on_state_code"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "jti", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "departments", "locations"
end
