from rest_framework import serializers
from .models import Note, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class NoteSerializer(serializers.ModelSerializer):
    is_owner = serializers.SerializerMethodField()
    user_updated_category = CategorySerializer(read_only=True)
    ai_generated_category = CategorySerializer(read_only=True)

    # Add a writable field for category ID reference
    user_updated_category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='user_updated_category', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'is_owner', 'user_updated_category',
                  'ai_generated_category', 'user_updated_category_id']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        return obj.is_owner(request.user)
