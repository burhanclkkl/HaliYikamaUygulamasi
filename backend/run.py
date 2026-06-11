from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5001) # AirPlay çakışmasını önlemek için 5001'e aldık