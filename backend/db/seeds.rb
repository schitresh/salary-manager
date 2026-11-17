# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

require "securerandom"

puts "== Seeding =="

hr_email = "hr@official.com"
hr_password = if Rails.env.development? || Rails.env.test?
  ENV.fetch("SEED_HR_PASSWORD", "Password123!")
else
  ENV.fetch("SEED_HR_PASSWORD")
end

user = User.find_or_initialize_by(email: hr_email)
if user.new_record?
  user.password = hr_password
  user.password_confirmation = hr_password
  user.jti ||= SecureRandom.uuid
  user.save!
  puts "Seeded HR user: #{hr_email}"
else
  puts "HR user already exists: #{hr_email}"
end

TARGET_EMPLOYEES = Integer(ENV.fetch("SEED_EMPLOYEE_COUNT", "10000"))
if Employee.count >= TARGET_EMPLOYEES
  puts "Employee data already present (#{Employee.count} >= #{TARGET_EMPLOYEES}); skipping bulk seed."
  puts "== Done =="
  return
end

if Employee.exists?
  puts "Existing employee data found (#{Employee.count}); clearing domain tables for reproducible seed..."
  Salary.delete_all
  Department.where.not(head_employee_id: nil).update_all(head_employee_id: nil)
  Employee.delete_all
  Department.delete_all
  Location.delete_all
end

rng = Random.new(42)
now = Time.current

# Valid Carmen-backed locations with currency context
location_defs = [
  { city: "Mumbai", state_code: "MH", country_code: "IN", currency: "INR" },
  { city: "Pune", state_code: "MH", country_code: "IN", currency: "INR" },
  { city: "Bengaluru", state_code: "KA", country_code: "IN", currency: "INR" },
  { city: "Delhi", state_code: "DL", country_code: "IN", currency: "INR" },
  { city: "Ahmedabad", state_code: "GJ", country_code: "IN", currency: "INR" },
  { city: "New York", state_code: "NY", country_code: "US", currency: "USD" },
  { city: "San Francisco", state_code: "CA", country_code: "US", currency: "USD" },
  { city: "Austin", state_code: "TX", country_code: "US", currency: "USD" },
  { city: "Seattle", state_code: "WA", country_code: "US", currency: "USD" },
  { city: "London", state_code: "ENG", country_code: "GB", currency: "GBP" },
  { city: "Manchester", state_code: "ENG", country_code: "GB", currency: "GBP" },
  { city: "Berlin", state_code: "BE", country_code: "DE", currency: "EUR" },
  { city: "Munich", state_code: "BY", country_code: "DE", currency: "EUR" },
  { city: "Paris", state_code: "IDF", country_code: "FR", currency: "EUR" },
  { city: "Lyon", state_code: "ARA", country_code: "FR", currency: "EUR" },
  { city: "Toronto", state_code: "ON", country_code: "CA", currency: "CAD" },
  { city: "Vancouver", state_code: "BC", country_code: "CA", currency: "CAD" },
  { city: "Sydney", state_code: "NSW", country_code: "AU", currency: "AUD" },
  { city: "Melbourne", state_code: "VIC", country_code: "AU", currency: "AUD" },
  { city: "Singapore", state_code: "SG-01", country_code: "SG", currency: "SGD" },
  { city: "Tokyo", state_code: "13", country_code: "JP", currency: "JPY" },
  { city: "Osaka", state_code: "27", country_code: "JP", currency: "JPY" },
  { city: "Dubai", state_code: "DU", country_code: "AE", currency: "AED" },
  { city: "Sao Paulo", state_code: "SP", country_code: "BR", currency: "BRL" }
]

puts "Creating locations..."
location_rows = location_defs.map do |loc|
  { city: loc[:city], state_code: loc[:state_code], country_code: loc[:country_code], created_at: now, updated_at: now }
end
Location.insert_all!(location_rows)
locations = Location.order(:id).to_a
location_meta = locations.each_with_index.map do |loc, idx|
  defn = location_defs[idx]
  { id: loc.id, currency: defn[:currency], country_code: loc.country_code }
end

puts "Creating departments..."
dept_names = %w[Engineering Product Design Data Analytics HR Finance Operations Sales Marketing Support Legal IT Security]
dept_rows = []
dept_names.each_with_index do |name, i|
  3.times do |n|
    loc = locations[(i * 3 + n) % locations.length]
    dept_rows << { name: "#{name} #{n + 1}", location_id: loc.id, head_employee_id: nil, created_at: now, updated_at: now }
  end
end
# ensure >= 50
while dept_rows.length < 60
  i = dept_rows.length
  loc = locations[i % locations.length]
  dept_rows << { name: "General #{i + 1}", location_id: loc.id, head_employee_id: nil, created_at: now, updated_at: now }
end
Department.insert_all!(dept_rows)
departments = Department.order(:id).to_a
dept_to_location = departments.to_h { |d| [d.id, d.location_id] }
location_to_meta = locations.each_with_index.to_h { |l, i| [l.id, location_meta[i]] }

first_names = %w[Aarav Vivaan Aditya Vihaan Arjun Rohan Kabir Isha Ananya Diya Meera Sara Liam Noah Emma Olivia Ava Sophia James Benjamin Lucas Mia Amelia Ethan Chloe Daniel Grace Leo Hannah]
last_names = %w[Sharma Patel Gupta Singh Kumar Mehta Reddy Iyer Nair Das Khan Smith Johnson Brown Taylor Anderson Thomas Jackson White Harris Martin Clark Lewis Walker Hall Young King]
job_titles = ["Software Engineer", "Senior Software Engineer", "Engineering Manager", "Product Manager", "Designer", "Data Analyst", "HR Specialist", "Finance Analyst", "Operations Associate", "Sales Executive", "Support Engineer", "QA Engineer"]

puts "Creating #{TARGET_EMPLOYEES} employees and salary histories..."
batch_size = 1000
base_join = Date.new(2018, 1, 1)
today = Date.current

(0...TARGET_EMPLOYEES).each_slice(batch_size) do |slice|
  employee_rows = []
  salary_rows = []
  emp_ids_offset = Employee.maximum(:id).to_i

  slice.each do |i|
    n = i + 1
    dept = departments[rng.rand(departments.length)]
    loc_meta = location_to_meta[dept.location_id]
    fn = first_names[rng.rand(first_names.length)]
    ln = last_names[rng.rand(last_names.length)]
    dob = Date.new(1970 + rng.rand(30), 1 + rng.rand(12), 1 + rng.rand(28))
    doj = base_join + rng.rand(2200)
    doj = [doj, dob + 18.years + 1.day].max
    doj = [doj, today - 30.days].min
    lwd = nil
    if rng.rand(20) == 0 # small portion with last working day
      lwd_candidate = doj + 365 + rng.rand(1200)
      lwd = lwd_candidate if lwd_candidate > doj && lwd_candidate < today - 10
    end
    title = job_titles[rng.rand(job_titles.length)]
    code = format("EMP%05d", n)
    email = format("employee%05d@official.com", n)
    phone = format("9%09d", n)

    employee_rows << {
      employee_code: code,
      first_name: fn,
      last_name: ln,
      email: email,
      phone: phone,
      date_of_birth: dob,
      date_of_joining: doj,
      last_working_day: lwd,
      job_title: title,
      department_id: dept.id,
      created_at: now,
      updated_at: now
    }
  end

  Employee.insert_all!(employee_rows)
  # fetch ids for this batch in order
  batch_emps = Employee.where(employee_code: slice.map { |i| format("EMP%05d", i + 1) }).order(:employee_code).pluck(:id, :employee_code, :date_of_joining, :department_id, :job_title)
  # map by employee_code
  emp_map = batch_emps.to_h { |id, code, doj, did, jt| [code, { id: id, doj: doj, department_id: did, job_title: jt }] }

  slice.each do |i|
    n = i + 1
    code = format("EMP%05d", n)
    info = emp_map[code]
    dept = departments.find { |d| d.id == info[:department_id] }
    currency = location_to_meta[dept.location_id][:currency]

    # salary history: 1 or 2 closed records + 1 current open record
    records = 1 + rng.rand(2) # 1-2 past
    start = info[:doj]
    base = case currency
           when "INR" then 30000 + rng.rand(120000)
           when "USD" then 4000 + rng.rand(12000)
           when "GBP" then 3000 + rng.rand(9000)
           when "EUR" then 3200 + rng.rand(9500)
           when "JPY" then 300000 + rng.rand(900000)
           when "AUD" then 4500 + rng.rand(10000)
           when "CAD" then 4200 + rng.rand(10000)
           when "SGD" then 3500 + rng.rand(9000)
           when "AED" then 8000 + rng.rand(20000)
           when "BRL" then 6000 + rng.rand(18000)
           else 3000 + rng.rand(10000)
           end

    current_from = start
    records.times do |r|
      period_days = 180 + rng.rand(540)
      from = current_from
      till = [from + period_days, today - 60 - (records - r) * 30].min
      till = from + 30 if till <= from
      hra = (base * 0.2).round(2)
      bonus = (base * rng.rand(0.0..0.15)).round(2)
      deduction = (base * rng.rand(0.0..0.05)).round(2)
      total = (base + hra + bonus - deduction).round(2)
      salary_rows << {
        employee_id: info[:id],
        department_id: info[:department_id],
        applicable_from: from,
        applicable_till: till,
        job_title: info[:job_title],
        currency: currency,
        base_amount: base,
        hra_amount: hra,
        bonus_amount: bonus,
        deduction_amount: deduction,
        total_amount: total,
        frequency: "month",
        created_at: now,
        updated_at: now
      }
      current_from = till + 1
      base = (base * (1.05 + rng.rand(0.15))).round(2)
    end

    # current open-ended salary
    from = [current_from, info[:doj]].max
    from = [from, today - 365].min
    # ensure no overlap/gap issues with last closed; if from <= last till adjust
    if salary_rows.any? && salary_rows.last[:employee_id] == info[:id]
      last_till = salary_rows.reverse.find { |sr| sr[:employee_id] == info[:id] }[:applicable_till]
      from = last_till + 1 if last_till && from <= last_till
    end
    from = info[:doj] if from < info[:doj]
    hra = (base * 0.2).round(2)
    bonus = (base * rng.rand(0.0..0.15)).round(2)
    deduction = (base * rng.rand(0.0..0.05)).round(2)
    total = (base + hra + bonus - deduction).round(2)
    salary_rows << {
      employee_id: info[:id],
      department_id: info[:department_id],
      applicable_from: from,
      applicable_till: nil,
      job_title: info[:job_title],
      currency: currency,
      base_amount: base,
      hra_amount: hra,
      bonus_amount: bonus,
      deduction_amount: deduction,
      total_amount: total,
      frequency: "month",
      created_at: now,
      updated_at: now
    }
  end

  Salary.insert_all!(salary_rows)
  puts "  seeded employees #{[slice.first + 1, TARGET_EMPLOYEES].min}-#{[slice.last + 1, TARGET_EMPLOYEES].min}"
end

# Set some department heads (first employee in department) where available
puts "Assigning department heads..."
departments.each do |dept|
  emp_id = Employee.where(department_id: dept.id).order(:id).limit(1).pick(:id)
  dept.update_column(:head_employee_id, emp_id) if emp_id
end

puts "Seed complete: #{Location.count} locations, #{Department.count} departments, #{Employee.count} employees, #{Salary.count} salaries."
puts "HR login: #{hr_email} / (SEED_HR_PASSWORD or default in dev)"
puts "== Done =="
