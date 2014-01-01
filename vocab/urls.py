from django.conf.urls import patterns, url

from vocab import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^definitions/([A-Za-z]+)$', views.definitions, name='definitions'),
    url(r'^sentences$', views.sentences, name='sentences'),
)
