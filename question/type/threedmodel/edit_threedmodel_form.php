<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Defines the editing form for the threedmodel question type.
 *
 * @package    qtype
 * @subpackage threedmodel
 * @copyright  2007 Jamie Pratt
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/**
 * threedmodel editing form definition.
 *
 * @copyright  2007 Jamie Pratt
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qtype_threedmodel_edit_form extends question_edit_form {

    /**
     * Add question-type specific form fields.
     *
     * @param MoodleQuickForm $mform the form being built.
     */
    public function qtype() {
        return 'threedmodel';
    }

    protected function definition_inner($mform) {
        // We don't need this default element.
        $mform->removeElement('defaultmark');
        $mform->addElement('hidden', 'defaultmark', 0);
        $mform->setType('defaultmark', PARAM_RAW);

        $filemanager_options = array();
        $filemanager_options['accepted_types'] = '*';
        $filemanager_options['maxbytes'] = 0;
        $filemanager_options['maxfiles'] = 10;
        // $filemanager_options['mainfile'] = true;

        $mform->addElement('filemanager', 'threedmodel', get_string('selectfiles'), null, $filemanager_options);
    }

    public function data_preprocessing($question) {
        $question = parent::data_preprocessing($question);
        $question = $this->data_preprocessing_hints($question);

        $draftitemid = file_get_submitted_draft_itemid('threedmodel');

        $filemanager_options = array();
        $filemanager_options['accepted_types'] = '*';
        $filemanager_options['maxbytes'] = 0;
        $filemanager_options['maxfiles'] = 10;

        file_prepare_draft_area($draftitemid, $this->context->id, 'qtype_threedmodel', 'threedmodel', !empty($question->id) ? (int) $question->id : null, $filemanager_options);
        $question->threedmodel = $draftitemid;


        return $question;
    }

    function validation($data, $files) {
        global $USER;

        $errors = parent::validation($data, $files);

        $usercontext = context_user::instance($USER->id);
        $fs = get_file_storage();
        if (!$files = $fs->get_area_files($usercontext->id, 'user', 'draft', $data['threedmodel'], 'sortorder, id', false)) {
            $errors['files'] = get_string('required');
            return $errors;
        }
        if (count($files) == 1) {
            // no need to select main file if only one picked
            return $errors;
        } else if (count($files) > 1) {
            foreach ($files as $file) {
                if (strtolower(pathinfo($file->get_filename(), PATHINFO_EXTENSION)) === 'dae') {
                    $file->set_sortorder(1);
                    break;
                } else {
                    // TODO: falls letztes $file: zurück zum Formular
                }
            }
        }
        return $errors;
    }

}
