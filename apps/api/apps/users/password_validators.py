import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class LetterAndSpecialValidator:
    """Require at least one letter, one digit, and one special character"""

    def validate(self, password, user=None):
        if not re.search(r'[a-zA-Z]', password):
            raise ValidationError(
                _('Password must contain at least one letter.'),
                code='password_no_letter',
            )
        if not re.search(r'\d', password):
            raise ValidationError(
                _('Password must contain at least one digit.'),
                code='password_no_digit',
            )
        if re.fullmatch(r'[\w]+', password):
            raise ValidationError(
                _('Password must contain at least one special character.'),
                code='password_no_special',
            )

    def get_help_text(self):
        return _('Password must contain at least one letter, one digit, and one special character.')
