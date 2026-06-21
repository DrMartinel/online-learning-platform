#!/bin/bash

git filter-branch --env-filter '
if [ "$GIT_AUTHOR_NAME" = "hungtunes" ] || [ "$GIT_AUTHOR_NAME" = "Hungtunes" ]; then
    export GIT_AUTHOR_NAME="hunghust5100"
    export GIT_AUTHOR_EMAIL="hung.nk235100@gmail.com"
    export GIT_COMMITTER_NAME="hunghust5100"
    export GIT_COMMITTER_EMAIL="hung.nk235100@gmail.com"
fi
' -f -- HEAD --all
