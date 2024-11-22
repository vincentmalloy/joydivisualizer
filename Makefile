.DEFAULT_GOAL := deploy

.PHONY: deploy

deploy:
	@rsync -avz --delete public/ joydivisualizer.things-remote.com:/var/www/joydivisualizer.things-remote.com/public
