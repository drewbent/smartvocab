APP_NAME = 'SmartVocab'

def add_app_name(request):
    from django.conf import settings
    return {'app_name': APP_NAME}