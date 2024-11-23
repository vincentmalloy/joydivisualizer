.DEFAULT_GOAL := deploy

.PHONY: deploy

user = simon
domain = joydivisualizer.things-remote.com
target_path = /var/www/$(domain)/public

deploy:
	@rsync -avz --delete public/ $(user)@$(domain):$(target_path)
