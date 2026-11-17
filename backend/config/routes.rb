Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :v1 do
    get "health", to: "health#show"

    namespace :auth do
      post "sign_in", to: "sessions#create"
      delete "sign_out", to: "sessions#destroy"
      post "password", to: "passwords#create"
      match "password", to: "passwords#update", via: [:put, :patch]
      match "invitation", to: "invitations#update", via: [:put, :patch]
    end

    resources :users, only: [:index, :create]
    resources :locations, only: [:index, :show, :create, :update]
  end
end
