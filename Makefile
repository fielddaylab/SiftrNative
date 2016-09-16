.PHONY: default first-time deploy-beta

default:
	gulp

first-time:
	npm install
	gulp

deploy-beta:
	rsync -vrc web/* root@morpheus.arisgames.org:/var/www/html/scratch/siftr-native --exclude-from rsync-exclude
