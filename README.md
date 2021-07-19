# Los deberes de Irene (web version)

...

## Local setup

* Install python3 and [pipenv](https://pipenv.pypa.io/).
* Clone this repo in your local machine.
* Install dependencies with
  ```
  pipenv install
  ```

## First time initialization

* Go to repository and execute `pipenv shell`.
* Copy `los_deberes_de_irene/settings/local.py.example` to `los_deberes_de_irene/settings/local.py`.
* Edit the file and customize it as needed (in particular, generate a SECRET_KEY as explained there).
* Initialize database (by default a local file using SQLite):
  ```
  ./manage.py migrate
  ```

## Run local server

* Go to repository and execute `pipenv shell`.
* Run local web server with
  ```
  ./manage.py runserver
  ```
* Browse to http://localhost:8000.

