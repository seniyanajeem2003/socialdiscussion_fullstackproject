from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('social_admin', '0010_alter_like_options_alter_notification_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='TypingStatus',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_seen', models.DateTimeField(auto_now=True)),
                ('chat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='typing_statuses', to='social_admin.chat')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='social_admin.user')),
            ],
            options={
                'unique_together': {('chat', 'user')},
            },
        ),
    ]
