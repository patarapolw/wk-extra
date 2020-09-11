<template>
  <v-container align-content-center>
    <v-row>
      <v-col>
        <v-card>
          <v-card-text>
            <v-row class="quiz-stats d-flex flex-sm-row flex-column">
              <v-col>
                <span class="key">Due</span>
                <span class="value quizstats-due">{{ quizStats.due }}</span>
              </v-col>
              <v-col>
                <span class="key">New</span>
                <span class="value quizstats-new">{{ quizStats.new }}</span>
              </v-col>
              <v-col>
                <span class="key">Leech</span>
                <span class="value quizstats-leech">{{ quizStats.leech }}</span>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="d-flex flex-row-reverse">
            <v-btn
              block
              @click="startQuiz"
            >Start Quiz</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <b>Options</b>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-expansion-panels
                multiple
                :value="expanded"
              >
                <v-expansion-panel
                  v-for="[k, v] in Object.entries(quizOptions)"
                  :key="k"
                >
                  <v-expansion-panel-header> {{ v.name }} </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-container class="">
                      <v-row
                        no-gutters
                        class="d-flex flex-sm-row flex-column my-n4"
                      >
                        <v-col
                          v-for="[k1, v1] in Object.entries(v.values)"
                          :key="k1"
                          class="my-n4"
                        >
                          <v-checkbox
                            :label="v1.name"
                            v-model="v1.selected"
                          />
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-treeview
          :items="treeviewParsed"
          v-model="treeviewSelection"
          dense
          selectable
          hoverable
          open-on-click
        >
          <template v-slot:append="{ item, open }">
            <div
              v-if="typeof item.level === 'object'"
              class="treeview-level"
            >
              (level {{item.level.from}}-{{item.level.to}})
            </div>

            <div
              class="treeview-stats"
              :style="{ visibility: (!item.children || !open) ? 'visible' : 'hidden' }"
            >
              <fragment v-if="item.stats">
                <div class="stats-new"> {{ item.stats.new }} </div>
                <div class="stats-due"> {{ item.stats.due }} </div>
                <div class="stats-leech"> {{ item.stats.leech }} </div>
              </fragment>
            </div>
          </template>
        </v-treeview>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" src="./index.ts" />

<style scoped>
.quiz-stats .key {
  display: inline-block;
  font-size: 1rem;
  font-weight: 700;
  width: 5rem;
}

.quiz-stats .key::after {
  content: " : ";
}

.quiz-stats .value {
  display: inline-flex;
  flex-direction: row-reverse;
}

@media screen and (min-width: 10rem) {
  .quiz-stats .value {
    min-width: 5rem;
  }
}

.treeview-level {
  display: inline-flex;
  flex-direction: row-reverse;
}

@media screen and (max-width: 500px) {
  .treeview-level {
    display: none;
  }
}

.treeview-stats {
  min-width: 10em;
  display: inline-grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.treeview-stats > div {
  display: inline-flex;
  flex-direction: row-reverse;
}

.stats-new {
  color: rgb(0, 255, 0);
}

.stats-due {
  color: blue;
}

.stats-leech {
  color: red;
}

.treeview-stats > div {
  display: inline-flex;
  flex-direction: row-reverse;
}
</style>
