from django_filters import rest_framework as filters
from .models import Task


class TaskFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    status = filters.ChoiceFilter(choices=Task.Status.choices)
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Task
        fields = []

    def filter_search(self, queryset, name, value):
        if not value or not value.strip():
            return queryset
        from django.db.models import Q
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )
